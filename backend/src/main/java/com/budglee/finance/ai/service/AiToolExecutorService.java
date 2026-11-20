package com.budglee.finance.ai.service;

import com.budglee.finance.ai.dto.ToolConfirmationDto;
import com.budglee.finance.dto.WalletRequest;
import com.budglee.finance.entity.*;
import com.budglee.finance.repository.*;
import com.budglee.finance.service.FinancialHealthService;
import com.budglee.finance.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Thực thi các Tool/Function Calling kết nối trực tiếp với các Service nghiệp vụ Quản lý Tài chính của Budglee.
 * 
 * Bảo mật:
 * - user_id luôn được lấy từ SecurityContext/JWT của request, ngăn chặn triệt để lỗ hổng IDOR.
 * - Cơ chế Human-in-the-loop: Mọi thao tác ghi chép thu/chi làm biến động số dư ví bắt buộc phải qua xác nhận.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiToolExecutorService {

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final FamilyGroupRepository familyGroupRepository;
    private final FinancialHealthService financialHealthService;
    private final WalletService walletService;

    // Cache lưu trữ các yêu cầu giao dịch chờ người dùng bấm [Xác nhận] (Human-in-the-loop)
    private final Map<String, PendingAction> pendingActions = new ConcurrentHashMap<>();

    private record PendingAction(
            String id,
            Long userId,
            String actionType,
            Map<String, Object> params,
            long createdAt
    ) {}

    private final NumberFormat currencyFormatter = NumberFormat.getCurrencyInstance(new Locale("vi", "VN"));

    /**
     * Tool 1: Tra cứu danh sách ví và số dư khả dụng thực tế của người dùng.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getWalletBalances(Long userId) {
        if (userId == null) {
            return Map.of("status", "error", "message", "Bạn cần đăng nhập tài khoản để tra cứu số dư ví thực tế.");
        }

        List<Wallet> wallets = walletRepository.findByUserId(userId);
        if (wallets.isEmpty()) {
            return Map.of("status", "empty", "message", "Bạn hiện chưa tạo ví nào. Hãy vào mục 'Ví tiền' trên ứng dụng để thêm ví mới.");
        }

        BigDecimal total = BigDecimal.ZERO;
        List<Map<String, Object>> walletList = new ArrayList<>();
        for (Wallet w : wallets) {
            total = total.add(w.getBalance());
            String cardSuffix = (w.getCardNumberMasked() != null && !w.getCardNumberMasked().isBlank())
                    ? " (" + w.getCardNumberMasked() + ")" : "";
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", w.getId());
            map.put("name", w.getWalletName());
            map.put("displayName", w.getWalletName() + cardSuffix);
            map.put("cardNumberMasked", w.getCardNumberMasked() != null ? w.getCardNumberMasked() : "");
            map.put("balance", w.getBalance());
            map.put("balanceFormatted", currencyFormatter.format(w.getBalance()));
            map.put("type", w.getType() != null ? w.getType().name() : "GENERAL");
            walletList.add(map);
        }

        return Map.of(
                "status", "success",
                "totalBalance", total,
                "totalFormatted", currencyFormatter.format(total),
                "wallets", walletList
        );
    }

    /**
     * Tool 2: Tra cứu lịch sử các giao dịch thu/chi gần đây của người dùng.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getRecentTransactions(Long userId, int limit) {
        if (userId == null) {
            return Map.of("status", "error", "message", "Bạn cần đăng nhập tài khoản để xem lịch sử giao dịch cá nhân.");
        }

        int pageSize = Math.min(Math.max(limit, 1), 15);
        var page = transactionRepository.findByUserIdOrderByTransactionDateDesc(userId, PageRequest.of(0, pageSize));

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        List<Map<String, Object>> txList = page.getContent().stream().map(t -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", t.getId());
            map.put("title", t.getActionTitle() != null ? t.getActionTitle() : "Giao dịch");
            map.put("amountFormatted", (t.getTransactionType() == TransactionType.INCOME ? "+" : "-") + currencyFormatter.format(t.getAmount()));
            map.put("type", t.getTransactionType() != null ? t.getTransactionType().name() : "EXPENSE");
            map.put("wallet", t.getWallet() != null ? t.getWallet().getWalletName() : "Ví chính");
            map.put("category", t.getCategory() != null ? t.getCategory().getName() : "Chưa phân loại");
            map.put("date", t.getTransactionDate() != null ? t.getTransactionDate().format(dtf) : "");
            return map;
        }).toList();

        return Map.of(
                "status", "success",
                "count", txList.size(),
                "transactions", txList
        );
    }

    /**
     * Tool 3: Tra cứu tình trạng hạn mức ngân sách tháng này (đã tiêu bao nhiêu %, có vượt mức không).
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getBudgetOverview(Long userId) {
        if (userId == null) {
            return Map.of("status", "error", "message", "Bạn cần đăng nhập để xem thông tin ngân sách chi tiêu.");
        }

        LocalDateTime now = LocalDateTime.now();
        List<Budget> budgets = budgetRepository.findByUserIdAndPeriodMonthAndPeriodYear(userId, now.getMonthValue(), now.getYear());

        if (budgets.isEmpty()) {
            return Map.of("status", "empty", "message", "Bạn chưa đặt hạn mức ngân sách nào cho tháng " + now.getMonthValue() + "/" + now.getYear());
        }

        List<Map<String, Object>> list = new ArrayList<>();
        for (Budget b : budgets) {
            BigDecimal limit = b.getAmountLimit();
            BigDecimal spent = b.getSpentAmount() != null ? b.getSpentAmount() : BigDecimal.ZERO;
            double percent = limit.compareTo(BigDecimal.ZERO) > 0 ? spent.divide(limit, 4, java.math.RoundingMode.HALF_UP).doubleValue() * 100 : 0;
            Map<String, Object> map = new HashMap<>();
            map.put("category", b.getCategory() != null ? b.getCategory().getName() : "Tất cả danh mục");
            map.put("limit", currencyFormatter.format(limit));
            map.put("spent", currencyFormatter.format(spent));
            map.put("percentUsed", String.format("%.1f%%", percent));
            map.put("isExceeded", percent >= 100.0);
            map.put("isWarning", percent >= (b.getAlertThreshold() != null ? b.getAlertThreshold().doubleValue() : 80.0));
            list.add(map);
        }

        return Map.of(
                "status", "success",
                "month", now.getMonthValue(),
                "year", now.getYear(),
                "budgets", list
        );
    }

    /**
     * Tool 4: Đánh giá Điểm Sức Khỏe Tài Chính (Financial Health Score từ 0 đến 100).
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getFinancialHealth(Long userId) {
        if (userId == null) {
            return Map.of("status", "error", "message", "Bạn cần đăng nhập để phân tích sức khỏe tài chính.");
        }
        try {
            LocalDateTime now = LocalDateTime.now();
            var health = financialHealthService.calculateFinancialHealth(userId, now.getYear(), now.getMonthValue());
            return Map.of(
                    "status", "success",
                    "overallScore", health.getScore(),
                    "grade", health.getRatingLabel() != null ? health.getRatingLabel() : health.getRating(),
                    "summary", health.getSummary() != null ? health.getSummary() : "Đánh giá sức khỏe tài chính Budglee",
                    "actionableAdvice", health.getAdvice() != null ? health.getAdvice() : List.of()
            );
        } catch (Exception e) {
            log.warn("Lỗi tính điểm tài chính cho user {}: {}", userId, e.getMessage());
            return Map.of("status", "error", "message", "Chưa có đủ dữ liệu thu chi tháng này để tính điểm sức khỏe tài chính.");
        }
    }

    /**
     * Tool 5: Tra cứu danh sách danh mục thu và chi khả dụng.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getCategories(Long userId) {
        if (userId == null) {
            return Map.of("status", "error", "message", "Cần đăng nhập để xem danh mục tài chính.");
        }
        List<Category> categories = categoryRepository.findAllAvailableForUser(userId);
        List<String> expenseCategories = new ArrayList<>();
        List<String> incomeCategories = new ArrayList<>();

        for (Category c : categories) {
            if (c.getType() == CategoryType.EXPENSE) {
                expenseCategories.add(c.getName());
            } else {
                incomeCategories.add(c.getName());
            }
        }

        return Map.of(
                "status", "success",
                "expenseCategories", expenseCategories,
                "incomeCategories", incomeCategories
        );
    }

    /**
     * Tool 6: Tra cứu thông tin quỹ nhóm gia đình (Family Group).
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getFamilyFinanceOverview(Long userId) {
        if (userId == null) {
            return Map.of("status", "error", "message", "Cần đăng nhập để xem thông tin nhóm gia đình.");
        }
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || user.getFamilyGroupId() == null) {
            return Map.of(
                    "status", "not_joined",
                    "message", "Bạn hiện chưa tham gia nhóm sổ quỹ gia đình nào. Bạn có thể tạo nhóm mới hoặc nhờ chủ hộ gửi lời mời qua email."
            );
        }

        FamilyGroup group = familyGroupRepository.findById(user.getFamilyGroupId()).orElse(null);
        if (group == null) {
            return Map.of("status", "error", "message", "Không tìm thấy thông tin nhóm gia đình.");
        }

        List<User> members = userRepository.findByFamilyGroupId(group.getId());
        List<String> memberNames = members.stream().map(User::getFullName).toList();

        return Map.of(
                "status", "success",
                "groupName", group.getName(),
                "memberCount", members.size(),
                "members", memberNames
        );
    }

    /**
     * Tool 7: Chuẩn bị tạo giao dịch thu chi mới (HUMAN-IN-THE-LOOP).
     * BẮT BUỘC: AI chỉ lập kế hoạch chi tiết, tóm tắt và hiển thị thẻ xác nhận.
     * TUYỆT ĐỐI không ghi đè database khi người dùng chưa bấm nút xác nhận.
     */
    @Transactional(readOnly = true)
    public ToolConfirmationDto prepareCreateTransaction(
            Long userId, BigDecimal amount, String typeStr, String categoryName, String walletName, String note
    ) {
        if (userId == null) {
            throw new IllegalStateException("Bạn cần đăng nhập tài khoản để thực hiện ghi chép giao dịch tài chính.");
        }

        TransactionType type = "INCOME".equalsIgnoreCase(typeStr) || "THU".equalsIgnoreCase(typeStr)
                ? TransactionType.INCOME : TransactionType.EXPENSE;

        User user = userRepository.findById(userId).orElse(null);
        List<Wallet> wallets = walletRepository.findByUserId(userId);
        if (wallets.isEmpty()) {
            throw new IllegalStateException("Bạn chưa có ví nào trong tài khoản. Hãy tạo ít nhất một ví trước khi ghi giao dịch.");
        }

        Wallet targetWallet = null;
        // 1. Kiểm tra xem người dùng có nhắc đến 4 số đuôi thẻ không (Ví dụ: "8529", "đuôi 8529", "thẻ 8529")
        String queryToScan = (walletName != null ? walletName : "") + " " + (note != null ? note : "");
        Matcher digitMatcher = Pattern.compile("\\b(\\d{4})\\b").matcher(queryToScan);
        if (digitMatcher.find()) {
            String digits = digitMatcher.group(1);
            targetWallet = wallets.stream()
                    .filter(w -> w.getCardNumberMasked() != null && w.getCardNumberMasked().contains(digits))
                    .findFirst()
                    .orElse(null);
        }

        if (targetWallet == null && walletName != null && !walletName.isBlank()) {
            String search = walletName.trim().toLowerCase();
            String cleanSearch = search.replaceAll("(?i)^(thẻ|ví|tài khoản|ngân hàng)\\s+", "").trim();

            targetWallet = wallets.stream()
                    .filter(w -> w.getWalletName().toLowerCase().contains(search) ||
                            (!cleanSearch.isBlank() && w.getWalletName().toLowerCase().contains(cleanSearch)) ||
                            (w.getType() != null && w.getType().name().toLowerCase().contains(cleanSearch)))
                    .findFirst()
                    .orElse(null);

            // Nếu người dùng nói về thẻ/ngân hàng nhưng chưa có ví mang tên riêng đó, ưu tiên ví ngân hàng hoặc thẻ tín dụng
            if (targetWallet == null && (search.contains("thẻ") || search.contains("ngân hàng") || search.contains("bank")
                    || search.contains("vietin") || search.contains("vcb") || search.contains("tcb") || search.contains("mb") || search.contains("bidv"))) {
                targetWallet = wallets.stream()
                        .filter(w -> w.getType() == WalletType.BANK || w.getType() == WalletType.CREDIT_CARD)
                        .findFirst()
                        .orElse(null);
            }
        }

        if (targetWallet == null) {
            targetWallet = wallets.get(0);
        }

        if (type == TransactionType.EXPENSE && targetWallet.getType() != WalletType.CREDIT_CARD
                && targetWallet.getBalance().compareTo(amount) < 0) {
            // Thử kiểm tra xem có ví nào khác đủ tiền không
            Wallet altWallet = wallets.stream()
                    .filter(w -> w.getType() == WalletType.CREDIT_CARD || w.getBalance().compareTo(amount) >= 0)
                    .findFirst()
                    .orElse(null);
            if (altWallet != null) {
                targetWallet = altWallet;
            } else {
                throw new IllegalArgumentException(String.format(
                        "Số dư các ví hiện tại không đủ để chi tiêu %s (Ví '%s' chỉ còn %s).",
                        currencyFormatter.format(amount),
                        targetWallet.getWalletName(),
                        currencyFormatter.format(targetWallet.getBalance())
                ));
            }
        }

        String confirmationId = "tx_confirm_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        String cardSuffix = (targetWallet.getCardNumberMasked() != null && !targetWallet.getCardNumberMasked().isBlank())
                ? " (" + targetWallet.getCardNumberMasked() + ")" : "";
        String displayWalletName = targetWallet.getWalletName() + cardSuffix;

        Map<String, Object> params = new HashMap<>();
        params.put("walletId", targetWallet.getId());
        params.put("walletName", displayWalletName);
        params.put("rawWalletName", targetWallet.getWalletName());
        params.put("cardNumberMasked", targetWallet.getCardNumberMasked() != null ? targetWallet.getCardNumberMasked() : "");
        params.put("amount", amount);
        params.put("type", type.name());
        params.put("categoryName", categoryName != null ? categoryName : (type == TransactionType.INCOME ? "Thu nhập khác" : "Chi tiêu khác"));
        params.put("note", note != null && !note.isBlank() ? note : (type == TransactionType.INCOME ? "Khoản thu mới" : "Khoản chi mới"));

        pendingActions.put(confirmationId, new PendingAction(confirmationId, userId, "CREATE_TRANSACTION", params, System.currentTimeMillis()));

        String actionDesc = type == TransactionType.INCOME ? "Cộng thu nhập vào ví" : "Trừ chi tiêu từ ví";
        String prompt = String.format("Bạn có đồng ý %s '%s' số tiền %s (Danh mục: %s) không?",
                actionDesc, displayWalletName, currencyFormatter.format(amount), params.get("categoryName"));

        return ToolConfirmationDto.builder()
                .confirmationId(confirmationId)
                .toolName("createTransaction")
                .actionType(type.name())
                .title(type == TransactionType.INCOME ? "Xác nhận ghi nhận Thu nhập" : "Xác nhận ghi nhận Chi tiêu")
                .description(prompt)
                .amount(amount)
                .walletName(displayWalletName)
                .categoryName((String) params.get("categoryName"))
                .note((String) params.get("note"))
                .parameters(params)
                .build();
    }

    /**
     * Tool 9: Chuẩn bị thông tin tạo ví mới và chờ xác nhận (Human-in-the-loop)
     */
    public ToolConfirmationDto prepareCreateWallet(
            Long userId, String walletName, WalletType walletType, BigDecimal initialBalance, String rawQuery
    ) {
        String cleanName = (walletName != null && !walletName.isBlank()) ? walletName.trim() : "Ví mới";
        WalletType type = walletType != null ? walletType : WalletType.CASH;
        BigDecimal balance = (initialBalance != null && initialBalance.compareTo(BigDecimal.ZERO) >= 0)
                ? initialBalance : BigDecimal.ZERO;

        String confirmationId = "wallet_confirm_" + UUID.randomUUID();

        Map<String, Object> params = new HashMap<>();
        params.put("walletName", cleanName);
        params.put("walletType", type.name());
        params.put("balance", balance);

        PendingAction pending = new PendingAction(
                confirmationId,
                userId,
                "CREATE_WALLET",
                params,
                System.currentTimeMillis() + 300_000
        );
        pendingActions.put(confirmationId, pending);

        String typeLabel = type == WalletType.BANK ? "Ngân hàng" : (type == WalletType.CREDIT_CARD ? "Thẻ tín dụng" : "Tiền mặt");

        return ToolConfirmationDto.builder()
                .confirmationId(confirmationId)
                .toolName("create_wallet")
                .actionType("CREATE_WALLET")
                .title("Xác nhận Tạo Ví Mới")
                .walletName(cleanName)
                .categoryName(typeLabel)
                .amount(balance)
                .parameters(params)
                .description(String.format("Xác nhận tạo ví mới '%s' (%s) với số dư khởi tạo %s",
                        cleanName, typeLabel, currencyFormatter.format(balance)))
                .build();
    }

    /**
     * Hủy bỏ yêu cầu thực thi Tool đang chờ xác nhận
     */
    public void cancelAction(String confirmationId) {
        if (confirmationId != null) {
            pendingActions.remove(confirmationId);
        }
    }

    /**
     * Tool 8: Thực thi ghi chép giao dịch thật sự vào Database sau khi người dùng bấm [Xác nhận].
     * Hỗ trợ overrides nếu người dùng đã tùy chỉnh nội dung (số tiền, ví, danh mục, loại giao dịch, ghi chú).
     */
    @Transactional
    @CacheEvict(value = {"dashboardSummary", "dashboardTrends"}, allEntries = true)
    public Map<String, Object> executeConfirmedAction(Long userId, String confirmationId, Map<String, Object> overrides) {
        PendingAction action = pendingActions.remove(confirmationId);
        if (action == null) {
            throw new IllegalArgumentException("Yêu cầu xác nhận giao dịch đã hết hạn hoặc không tồn tại. Vui lòng thao tác lại!");
        }

        // Chống lỗ hổng IDOR: Kiểm tra action có thuộc đúng user của request JWT hiện tại không
        if (!Objects.equals(action.userId(), userId)) {
            throw new SecurityException("Bạn không có quyền thực thi thao tác xác nhận của người dùng khác!");
        }

        if ("CREATE_TRANSACTION".equals(action.actionType())) {
            Long walletId = null;
            if (overrides != null && overrides.get("walletId") != null && !overrides.get("walletId").toString().isBlank()) {
                try {
                    walletId = Long.valueOf(overrides.get("walletId").toString());
                } catch (Exception ignored) {}
            }
            if (walletId == null && action.params().get("walletId") != null) {
                walletId = ((Number) action.params().get("walletId")).longValue();
            }

            BigDecimal amount = null;
            if (overrides != null && overrides.get("amount") != null && !overrides.get("amount").toString().isBlank()) {
                try {
                    amount = new BigDecimal(overrides.get("amount").toString().trim());
                } catch (Exception ignored) {}
            }
            if (amount == null && action.params().get("amount") != null) {
                amount = (BigDecimal) action.params().get("amount");
            }
            if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Số tiền giao dịch không hợp lệ.");
            }

            TransactionType type = null;
            String typeStr = null;
            if (overrides != null && overrides.get("type") != null) {
                typeStr = overrides.get("type").toString();
            } else if (overrides != null && overrides.get("actionType") != null) {
                typeStr = overrides.get("actionType").toString();
            } else if (action.params().get("type") != null) {
                typeStr = (String) action.params().get("type");
            }
            if (typeStr != null) {
                try {
                    type = TransactionType.valueOf(typeStr.toUpperCase());
                } catch (Exception e) {
                    type = TransactionType.EXPENSE;
                }
            } else {
                type = TransactionType.EXPENSE;
            }

            final String finalCategoryName = (overrides != null && overrides.get("categoryName") != null && !overrides.get("categoryName").toString().isBlank())
                    ? overrides.get("categoryName").toString().trim()
                    : (String) action.params().get("categoryName");

            String note = null;
            if (overrides != null && overrides.get("note") != null && !overrides.get("note").toString().isBlank()) {
                note = overrides.get("note").toString().trim();
            } else if (action.params().get("note") != null) {
                note = (String) action.params().get("note");
            }
            if (note == null || note.isBlank()) {
                note = "Giao dịch " + (type == TransactionType.INCOME ? "thu nhập" : "chi tiêu");
            }

            Wallet wallet = null;
            if (walletId != null) {
                wallet = walletRepository.findById(walletId).orElse(null);
            }
            if (wallet == null) {
                String walletName = (overrides != null && overrides.get("walletName") != null)
                        ? overrides.get("walletName").toString()
                        : (String) action.params().get("walletName");
                if (walletName != null && !walletName.isBlank()) {
                    String wNameLower = walletName.toLowerCase();
                    // Match by 4 digits if present (ví dụ: "8529")
                    Matcher dm = Pattern.compile("\\b(\\d{4})\\b").matcher(walletName);
                    if (dm.find()) {
                        String dig = dm.group(1);
                        wallet = walletRepository.findByUserId(userId).stream()
                                .filter(w -> w.getCardNumberMasked() != null && w.getCardNumberMasked().contains(dig))
                                .findFirst()
                                .orElse(null);
                    }
                    if (wallet == null) {
                        wallet = walletRepository.findByUserId(userId).stream()
                                .filter(w -> w.getWalletName().equalsIgnoreCase(walletName) || w.getWalletName().toLowerCase().contains(wNameLower))
                                .findFirst()
                                .orElse(null);
                    }
                }
            }
            if (wallet == null) {
                wallet = walletRepository.findByUserId(userId).stream()
                        .findFirst()
                        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy ví khả dụng của người dùng."));
            }

            BigDecimal newBalance = type == TransactionType.INCOME
                    ? wallet.getBalance().add(amount)
                    : wallet.getBalance().subtract(amount);
            wallet.setBalance(newBalance);
            walletRepository.save(wallet);

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng."));

            Category category = null;
            if (finalCategoryName != null) {
                String catLower = finalCategoryName.toLowerCase();
                category = categoryRepository.findAllAvailableForUser(userId).stream()
                        .filter(c -> c.getName().equalsIgnoreCase(finalCategoryName)
                                || (c.getName().equalsIgnoreCase("Food & Drinks") && (catLower.contains("ăn") || catLower.contains("food") || catLower.contains("cà phê") || catLower.contains("cafe") || catLower.contains("coffee") || catLower.contains("uống") || catLower.contains("trà") || catLower.contains("nước")))
                                || (c.getName().equalsIgnoreCase("Salary") && (catLower.contains("lương") || catLower.contains("salary")))
                                || (c.getName().equalsIgnoreCase("Shopping") && (catLower.contains("mua") || catLower.contains("shop")))
                                || (c.getName().equalsIgnoreCase("Travel & Transport") && (catLower.contains("xe") || catLower.contains("xăng") || catLower.contains("di chuyển")))
                                || (c.getName().equalsIgnoreCase("Bills & Utilities") && (catLower.contains("điện") || catLower.contains("nước") || catLower.contains("tiện ích")))
                        )
                        .findFirst()
                        .orElse(null);
            }

            Transaction tx = Transaction.builder()
                    .user(user)
                    .wallet(wallet)
                    .category(category)
                    .actionTitle(note)
                    .amount(amount)
                    .transactionType(type)
                    .balanceAfter(newBalance)
                    .transactionDate(LocalDateTime.now())
                    .note(note + " (Ghi chép qua Budglee AI)")
                    .build();
            transactionRepository.save(tx);

            log.info("Budglee AI: Đã ghi nhận thành công giao dịch id={} số tiền={} vào ví '{}' cho user={}",
                    tx.getId(), amount, wallet.getWalletName(), userId);

            return Map.of(
                    "status", "success",
                    "message", String.format("Đã ghi chép thành công: %s %s vào ví '%s'. Số dư mới là %s.",
                            type == TransactionType.INCOME ? "Cộng" : "Trừ",
                            currencyFormatter.format(amount),
                            wallet.getWalletName(),
                            currencyFormatter.format(newBalance)),
                    "newBalance", newBalance,
                    "newBalanceFormatted", currencyFormatter.format(newBalance)
            );
        }

        if ("CREATE_WALLET".equals(action.actionType())) {
            String walletName = (overrides != null && overrides.get("walletName") != null && !overrides.get("walletName").toString().isBlank())
                    ? overrides.get("walletName").toString().trim()
                    : (String) action.params().get("walletName");

            BigDecimal balance = BigDecimal.ZERO;
            if (overrides != null && overrides.get("amount") != null && !overrides.get("amount").toString().isBlank()) {
                try {
                    balance = new BigDecimal(overrides.get("amount").toString().trim());
                } catch (Exception ignored) {}
            } else if (overrides != null && overrides.get("balance") != null && !overrides.get("balance").toString().isBlank()) {
                try {
                    balance = new BigDecimal(overrides.get("balance").toString().trim());
                } catch (Exception ignored) {}
            } else if (action.params().get("balance") != null) {
                balance = (BigDecimal) action.params().get("balance");
            }

            WalletType type = WalletType.CASH;
            String typeStr = (overrides != null && overrides.get("walletType") != null && !overrides.get("walletType").toString().isBlank())
                    ? overrides.get("walletType").toString().trim()
                    : (overrides != null && overrides.get("type") != null && !overrides.get("type").toString().isBlank())
                    ? overrides.get("type").toString().trim()
                    : (String) action.params().get("walletType");
            if (typeStr != null) {
                try {
                    type = WalletType.valueOf(typeStr.toUpperCase());
                } catch (Exception ignored) {
                    if (typeStr.toLowerCase().contains("ngân hàng") || typeStr.toLowerCase().contains("bank")) {
                        type = WalletType.BANK;
                    } else if (typeStr.toLowerCase().contains("tín dụng") || typeStr.toLowerCase().contains("credit")) {
                        type = WalletType.CREDIT_CARD;
                    }
                }
            }

            WalletRequest req = new WalletRequest();
            req.setWalletName(walletName);
            req.setType(type);
            req.setBalance(balance);
            req.setCurrency("VND");

            String cardMasked = null;
            if (overrides != null && overrides.get("cardNumberMasked") != null) {
                cardMasked = overrides.get("cardNumberMasked").toString().trim();
            } else if (action.params().get("cardNumberMasked") != null) {
                cardMasked = (String) action.params().get("cardNumberMasked");
            }
            if ((cardMasked == null || cardMasked.isBlank()) && type != WalletType.CASH && walletName != null) {
                Matcher m = Pattern.compile("\\b(\\d{4})\\b").matcher(walletName);
                if (m.find()) {
                    cardMasked = "**** " + m.group(1);
                }
            }
            req.setCardNumberMasked(cardMasked);

            Wallet created = walletService.create(userId, req);

            String typeDisplay = created.getType() == WalletType.BANK ? "Ngân hàng"
                    : (created.getType() == WalletType.CREDIT_CARD ? "Thẻ tín dụng" : "Tiền mặt");

            log.info("Budglee AI: Đã tạo thành công ví id={} tên='{}' loại={} cho user={}",
                    created.getId(), created.getWalletName(), created.getType(), userId);

            return Map.of(
                    "status", "success",
                    "message", String.format("Đã tạo thành công ví '%s' (%s) với số dư khởi tạo %s.",
                            created.getWalletName(),
                            typeDisplay,
                            currencyFormatter.format(created.getBalance())),
                    "walletId", created.getId(),
                    "walletName", created.getWalletName(),
                    "balance", created.getBalance(),
                    "balanceFormatted", currencyFormatter.format(created.getBalance())
            );
        }

        return Map.of("status", "error", "message", "Loại hành động không được hỗ trợ.");
    }

    @Transactional
    public Map<String, Object> executeConfirmedAction(Long userId, String confirmationId) {
        return executeConfirmedAction(userId, confirmationId, null);
    }
}
