package com.budglee.finance.ai.service;

import com.budglee.finance.ai.dto.ToolConfirmationDto;
import com.budglee.finance.entity.*;
import com.budglee.finance.repository.*;
import com.budglee.finance.service.FinancialHealthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
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
            walletList.add(Map.of(
                    "id", w.getId(),
                    "name", w.getWalletName(),
                    "balance", w.getBalance(),
                    "balanceFormatted", currencyFormatter.format(w.getBalance()),
                    "type", w.getType() != null ? w.getType().name() : "GENERAL"
            ));
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
        Map<Long, Wallet> walletMap = new LinkedHashMap<>();
        walletRepository.findByUserId(userId)
                .forEach(w -> walletMap.put(w.getId(), w));
        if (user != null && user.getFamilyGroupId() != null && !user.getFamilyGroupId().isBlank()) {
            walletRepository.findByFamilyGroupId(user.getFamilyGroupId())
                    .forEach(w -> walletMap.putIfAbsent(w.getId(), w));
        }
        List<Wallet> wallets = new ArrayList<>(walletMap.values());
        if (wallets.isEmpty()) {
            throw new IllegalStateException("Bạn chưa có ví nào trong tài khoản. Hãy tạo ít nhất một ví trước khi ghi giao dịch.");
        }

        Wallet targetWallet;
        if (walletName != null && !walletName.isBlank()) {
            String search = walletName.trim().toLowerCase();
            targetWallet = wallets.stream()
                    .filter(w -> w.getWalletName().toLowerCase().contains(search) ||
                            (w.getType() != null && w.getType().name().toLowerCase().contains(search)))
                    .findFirst()
                    .orElse(null);
            if (targetWallet == null) {
                String existingNames = wallets.stream().map(Wallet::getWalletName).collect(Collectors.joining(", "));
                throw new IllegalArgumentException(String.format(
                        "Không tìm thấy ví nào phù hợp với '%s' trong tài khoản của bạn. Danh sách ví hiện có: %s.",
                        walletName, existingNames
                ));
            }
        } else {
            targetWallet = wallets.get(0);
        }

        if (type == TransactionType.EXPENSE && targetWallet.getType() != WalletType.CREDIT_CARD
                && targetWallet.getBalance().compareTo(amount) < 0) {
            throw new IllegalArgumentException(String.format(
                    "Số dư ví '%s' hiện tại (%s) không đủ để chi tiêu %s.",
                    targetWallet.getWalletName(),
                    currencyFormatter.format(targetWallet.getBalance()),
                    currencyFormatter.format(amount)
            ));
        }

        String confirmationId = "tx_confirm_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);

        Map<String, Object> params = new HashMap<>();
        params.put("walletId", targetWallet.getId());
        params.put("walletName", targetWallet.getWalletName());
        params.put("amount", amount);
        params.put("type", type.name());
        params.put("categoryName", categoryName != null ? categoryName : (type == TransactionType.INCOME ? "Thu nhập khác" : "Chi tiêu khác"));
        params.put("note", note != null && !note.isBlank() ? note : (type == TransactionType.INCOME ? "Khoản thu mới" : "Khoản chi mới"));

        pendingActions.put(confirmationId, new PendingAction(confirmationId, userId, "CREATE_TRANSACTION", params, System.currentTimeMillis()));

        String actionDesc = type == TransactionType.INCOME ? "Cộng thu nhập vào ví" : "Trừ chi tiêu từ ví";
        String prompt = String.format("Bạn có đồng ý %s '%s' số tiền %s (Danh mục: %s) không?",
                actionDesc, targetWallet.getWalletName(), currencyFormatter.format(amount), params.get("categoryName"));

        return ToolConfirmationDto.builder()
                .confirmationId(confirmationId)
                .toolName("createTransaction")
                .actionType(type.name())
                .title(type == TransactionType.INCOME ? "Xác nhận ghi nhận Thu nhập" : "Xác nhận ghi nhận Chi tiêu")
                .description(prompt)
                .amount(amount)
                .walletName(targetWallet.getWalletName())
                .categoryName((String) params.get("categoryName"))
                .note((String) params.get("note"))
                .parameters(params)
                .build();
    }

    /**
     * Tool 8: Thực thi ghi chép giao dịch thật sự vào Database sau khi người dùng bấm [Xác nhận].
     */
    @Transactional
    public Map<String, Object> executeConfirmedAction(Long userId, String confirmationId) {
        PendingAction action = pendingActions.remove(confirmationId);
        if (action == null) {
            throw new IllegalArgumentException("Yêu cầu xác nhận giao dịch đã hết hạn hoặc không tồn tại. Vui lòng thao tác lại!");
        }

        // Chống lỗ hổng IDOR: Kiểm tra action có thuộc đúng user của request JWT hiện tại không
        if (!Objects.equals(action.userId(), userId)) {
            throw new SecurityException("Bạn không có quyền thực thi thao tác xác nhận của người dùng khác!");
        }

        if ("CREATE_TRANSACTION".equals(action.actionType())) {
            Long walletId = ((Number) action.params().get("walletId")).longValue();
            BigDecimal amount = (BigDecimal) action.params().get("amount");
            TransactionType type = TransactionType.valueOf((String) action.params().get("type"));
            String categoryName = (String) action.params().get("categoryName");
            String note = (String) action.params().get("note");

            Wallet wallet = walletRepository.findById(walletId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy ví đã chọn."));

            BigDecimal newBalance = type == TransactionType.INCOME
                    ? wallet.getBalance().add(amount)
                    : wallet.getBalance().subtract(amount);
            wallet.setBalance(newBalance);
            walletRepository.save(wallet);

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng."));

            Category category = categoryRepository.findAllAvailableForUser(userId).stream()
                    .filter(c -> c.getName().equalsIgnoreCase(categoryName)
                            || ("Food & Drinks".equalsIgnoreCase(c.getName()) && (categoryName.toLowerCase().contains("ăn") || categoryName.toLowerCase().contains("food")))
                            || ("Salary".equalsIgnoreCase(c.getName()) && (categoryName.toLowerCase().contains("lương") || categoryName.toLowerCase().contains("salary")))
                            || ("Shopping".equalsIgnoreCase(c.getName()) && (categoryName.toLowerCase().contains("mua") || categoryName.toLowerCase().contains("shop")))
                            || ("Travel & Transport".equalsIgnoreCase(c.getName()) && (categoryName.toLowerCase().contains("xe") || categoryName.toLowerCase().contains("xăng") || categoryName.toLowerCase().contains("di chuyển")))
                            || ("Bills & Utilities".equalsIgnoreCase(c.getName()) && (categoryName.toLowerCase().contains("điện") || categoryName.toLowerCase().contains("nước") || categoryName.toLowerCase().contains("tiện ích")))
                    )
                    .findFirst()
                    .orElse(null);

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

        return Map.of("status", "error", "message", "Loại hành động không được hỗ trợ.");
    }
}
