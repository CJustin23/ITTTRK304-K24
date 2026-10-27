package com.budglee.finance.service;

import com.budglee.finance.dto.TransactionRequest;
import com.budglee.finance.entity.Category;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * =========================================================================
 * SERVICE: QUẢN LÝ GIAO DỊCH THU CHI (TRANSACTIONS)
 * Phụ trách: Nguyễn Trường An (Backend Lead) — nhánh 'an'
 *
 * Quy tắc đã cài đặt:
 * 1. Ví và danh mục phải thuộc về người dùng gọi (BR-01); không được thì trả 404/400.
 * 2. INCOME cộng số dư, EXPENSE trừ số dư; cập nhật ví và giao dịch trong cùng @Transactional.
 * 3. Chỉ ví loại CREDIT_CARD mới được số dư âm, các ví khác trả 400.
 * 4. Luôn lưu balance_after; ngày giao dịch mặc định là hiện tại nếu FE không gửi.
 *
 * Còn nợ: TRANSFER giữa hai ví (schema chưa có cột liên kết bản ghi) — trả 501 có chủ đích.
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
    public Transaction createTransaction(Long userId, TransactionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tài khoản không còn tồn tại"));

        if (request.getTransactionType() == TransactionType.TRANSFER) {
            throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED,
                    "Chuyển khoản giữa hai ví cần bổ sung cột liên kết giao dịch, thống nhất trong Sprint 2");
        }

        Wallet wallet = walletRepository.findById(request.getWalletId())
                .filter(w -> w.getUser() != null && userId.equals(w.getUser().getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Ví không tồn tại hoặc không thuộc về bạn"));

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

    public Page<Transaction> getUserTransactions(Long userId, Pageable pageable) {
        return transactionRepository.findByUserIdOrderByTransactionDateDesc(userId, pageable);
    }
}
