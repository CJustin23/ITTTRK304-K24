package com.budglee.finance.service;

import com.budglee.finance.dto.TransactionRequest;
import com.budglee.finance.entity.Category;
import com.budglee.finance.entity.Role;
import com.budglee.finance.entity.Transaction;
import com.budglee.finance.entity.TransactionType;
import com.budglee.finance.entity.User;
import com.budglee.finance.entity.Wallet;
import com.budglee.finance.entity.WalletType;
import com.budglee.finance.repository.CategoryRepository;
import com.budglee.finance.repository.TransactionRepository;
import com.budglee.finance.repository.UserRepository;
import com.budglee.finance.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * =========================================================================
 * SERVICE: QUẢN LÝ GIAO DỊCH THU CHI (TRANSACTIONS)
 * Phụ trách: Nguyễn Trường An (Backend Lead) — nhánh 'an'
 *
 * Quy tắc đã cài đặt:
 * 1. Ví phải của chính người gọi, hoặc là ví chung cùng nhóm hộ và người gọi là FAMILY_ADMIN
 *    (DUAN-40). Trường hợp còn lại trả 404 như thể không tồn tại, để không cho dò id.
 * 2. INCOME cộng số dư, EXPENSE trừ số dư; cập nhật ví và lưu giao dịch trong cùng @Transactional.
 * 3. Chỉ ví CREDIT_CARD được phép âm số dư, ví khác trả 400 và toàn bộ giao dịch bị rollback.
 * 4. balance_after luôn được lưu; ngày giao dịch lấy hiện tại nếu frontend không gửi.
 * 5. TRANSFER giữa hai ví ghi thành hai bản ghi EXPENSE/INCOME nối nhau qua linked_transaction_id
 *    (V8), nên lịch sử hai ví đều đầy đủ mà số dư không bao giờ lệch nhau.
 * =========================================================================
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final WalletRepository walletRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    @Transactional
    @CacheEvict(value = {"dashboardSummary", "dashboardTrends"}, allEntries = true)
    public Transaction createTransaction(Long userId, TransactionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tài khoản không còn tồn tại"));

        if (request.getTransactionType() == TransactionType.TRANSFER) {
            return transfer(user, request);
        }

        Wallet wallet = findUsableWallet(request.getWalletId(), user);

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .filter(c -> c.getUser() == null || userId.equals(c.getUser().getId()))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Danh mục không tồn tại hoặc không thuộc về bạn"));
        }

        BigDecimal amount = request.getAmount();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số tiền phải lớn hơn 0");
        }

        BigDecimal signed = request.getTransactionType() == TransactionType.INCOME
                ? amount
                : amount.negate();
        BigDecimal newBalance = wallet.getBalance().add(signed);

        if (newBalance.compareTo(BigDecimal.ZERO) < 0 && wallet.getType() != WalletType.CREDIT_CARD) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Số dư ví không đủ; chỉ thẻ tín dụng (CREDIT_CARD) mới cho phép âm");
        }

        wallet.setBalance(newBalance);
        walletRepository.save(wallet);

        Transaction transaction = Transaction.builder()
                .wallet(wallet)
                .category(category)
                .user(user)
                .actionTitle(request.getActionTitle().trim())
                .amount(amount)
                .transactionType(request.getTransactionType())
                .balanceAfter(newBalance)
                .transactionDate(request.getTransactionDate() == null ? LocalDateTime.now() : request.getTransactionDate())
                .note(request.getNote())
                .build();

        Transaction saved = transactionRepository.save(transaction);
        log.info("Ghi nhận giao dịch id={} ví={} loại={} số tiền={} số dư sau giao dịch={}",
                saved.getId(), wallet.getId(), saved.getTransactionType(), amount, newBalance);
        return saved;
    }

    /**
     * Chuyển giữa hai ví ghi thành hai bản ghi nối nhau: EXPENSE ở ví nguồn và INCOME ở ví đích,
     * mỗi bên có balance_after riêng nên lịch sử của cả hai ví đều đúng. Danh mục bị bỏ qua vì
     * chuyển tiền giữa hai ví của mình không phải thu hay chi.
     */
    @Transactional
    public Transaction transfer(User actor, TransactionRequest request) {
        Long toWalletId = request.getToWalletId();
        if (toWalletId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Chuyển giữa hai ví phải kèm ví nhận (toWalletId)");
        }
        if (toWalletId.equals(request.getWalletId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Ví gửi và ví nhận phải là hai ví khác nhau");
        }

        Wallet source = findUsableWallet(request.getWalletId(), actor);
        Wallet target = findUsableWallet(toWalletId, actor);

        BigDecimal amount = request.getAmount();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số tiền phải lớn hơn 0");
        }

        BigDecimal afterSource = source.getBalance().subtract(amount);
        if (afterSource.compareTo(BigDecimal.ZERO) < 0 && source.getType() != WalletType.CREDIT_CARD) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Số dư ví không đủ; chỉ thẻ tín dụng (CREDIT_CARD) mới cho phép âm");
        }
        BigDecimal afterTarget = target.getBalance().add(amount);
        LocalDateTime when = request.getTransactionDate() == null
                ? LocalDateTime.now()
                : request.getTransactionDate();
        String title = request.getActionTitle().trim();

        // Tru ví nguồn trước, cộng ví đích sau: hai bước nằm trong cùng một transaction nên không
        // có trường hợp mất tiền mà bên nhận không có.
        source.setBalance(afterSource);
        walletRepository.save(source);
        Transaction outgoing = transactionRepository.save(Transaction.builder()
                .wallet(source)
                .user(actor)
                .actionTitle(title)
                .amount(amount)
                .transactionType(TransactionType.EXPENSE)
                .balanceAfter(afterSource)
                .transactionDate(when)
                .note(request.getNote())
                .build());

        target.setBalance(afterTarget);
        walletRepository.save(target);
        Transaction incoming = transactionRepository.save(Transaction.builder()
                .wallet(target)
                .user(actor)
                .actionTitle(title)
                .amount(amount)
                .transactionType(TransactionType.INCOME)
                .balanceAfter(afterTarget)
                .transactionDate(when)
                .note(request.getNote())
                .build());

        outgoing.setLinkedTransactionId(incoming.getId());
        incoming.setLinkedTransactionId(outgoing.getId());
        transactionRepository.save(outgoing);
        transactionRepository.save(incoming);

        log.info("Chuyển {} từ ví={} (con {}) sang ví={} (con {}) bởi user={}",
                amount, source.getId(), afterSource, target.getId(), afterTarget, actor.getId());
        return outgoing;
    }

    @Transactional(readOnly = true)
    public Page<Transaction> getUserTransactions(Long userId, Pageable pageable) {
        List<Long> walletIds = visibleWalletIds(userId);
        if (walletIds.isEmpty()) {
            return Page.empty(pageable);
        }
        return transactionRepository.findByWalletIdInOrderByTransactionDateDesc(walletIds, pageable);
    }

    /**
     * Ví của chính mình, cộng với ví chung của hộ gia đình mà mình là thành viên (DUAN-40).
     */
    private List<Long> visibleWalletIds(Long userId) {
        User actor = userRepository.findById(userId).orElse(null);
        if (actor == null) {
            return List.of();
        }
        Map<Long, Long> ids = new LinkedHashMap<>();
        walletRepository.findByUserId(userId)
                .forEach(wallet -> ids.put(wallet.getId(), wallet.getId()));
        String familyGroupId = actor.getFamilyGroupId();
        if (familyGroupId != null && !familyGroupId.isBlank()) {
            walletRepository.findByFamilyGroupId(familyGroupId)
                    .forEach(wallet -> ids.putIfAbsent(wallet.getId(), wallet.getId()));
        }
        return new ArrayList<>(ids.keySet());
    }

    private Wallet findUsableWallet(Long walletId, User actor) {
        return walletRepository.findById(walletId)
                .filter(w -> canUse(w, actor))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Ví không tồn tại hoặc không thuộc về bạn"));
    }

    /**
     * Chủ ví luôn ghi được giao dịch. Chủ hộ (FAMILY_ADMIN) được ghi thêm vào ví chung
     * của những thành viên cùng nhóm hộ; người ngoài hộ không thấy ví đó.
     */
    private boolean canUse(Wallet wallet, User actor) {
        if (wallet.getUser() == null) {
            return false;
        }
        if (actor.getId().equals(wallet.getUser().getId())) {
            return true;
        }
        String walletGroup = wallet.getFamilyGroupId();
        return actor.getRole() == Role.FAMILY_ADMIN
                && actor.getFamilyGroupId() != null
                && walletGroup != null
                && actor.getFamilyGroupId().equals(walletGroup);
    }
}
