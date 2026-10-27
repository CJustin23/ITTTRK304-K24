package com.budglee.finance.service;

import com.budglee.finance.dto.TransactionRequest;
import com.budglee.finance.entity.*;
import com.budglee.finance.repository.CategoryRepository;
import com.budglee.finance.repository.TransactionRepository;
import com.budglee.finance.repository.UserRepository;
import com.budglee.finance.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final WalletRepository walletRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    @Transactional
    public Transaction createTransaction(Long userId, TransactionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng ID: " + userId));

        Wallet wallet = walletRepository.findById(request.getWalletId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy ví ID: " + request.getWalletId()));

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId()).orElse(null);
        }

        BigDecimal currentBalance = wallet.getBalance();
        BigDecimal newBalance;

        if (request.getTransactionType() == TransactionType.INCOME) {
            newBalance = currentBalance.add(request.getAmount());
        } else if (request.getTransactionType() == TransactionType.EXPENSE) {
            if (wallet.getType() != WalletType.CREDIT_CARD && currentBalance.compareTo(request.getAmount()) < 0) {
                throw new IllegalStateException("Số dư ví không đủ để thực hiện giao dịch chi tiêu này");
            }
            newBalance = currentBalance.subtract(request.getAmount());
        } else {
            // TRANSFER
            newBalance = currentBalance.subtract(request.getAmount());
        }

        wallet.setBalance(newBalance);
        walletRepository.save(wallet);

        Transaction transaction = Transaction.builder()
                .user(user)
                .wallet(wallet)
                .category(category)
                .actionTitle(request.getActionTitle())
                .amount(request.getAmount())
                .transactionType(request.getTransactionType())
                .balanceAfter(newBalance)
                .transactionDate(request.getTransactionDate() != null ? request.getTransactionDate() : LocalDateTime.now())
                .note(request.getNote())
                .build();

        return transactionRepository.save(transaction);
    }

    @Transactional(readOnly = true)
    public Page<Transaction> getUserTransactions(Long userId, Pageable pageable) {
        return transactionRepository.findByUserIdOrderByTransactionDateDesc(userId, pageable);
    }
}
