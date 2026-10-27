package com.budglee.finance.service;

import com.budglee.finance.dto.TransactionRequest;
import com.budglee.finance.entity.Transaction;
import com.budglee.finance.repository.CategoryRepository;
import com.budglee.finance.repository.TransactionRepository;
import com.budglee.finance.repository.UserRepository;
import com.budglee.finance.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

/**
 * =========================================================================
 * KHUÔN MẪU SERVICE: QUẢN LÝ GIAO DỊCH THU CHI (TRANSACTIONS)
 * Phụ trách: Nguyễn Trường An (Backend Lead)
 * Nhánh làm việc: 'an'
 *
 * Yêu cầu nghiệp vụ cần làm:
 * 1. Kiểm tra tính hợp lệ của Wallet, Category và User.
 * 2. Sử dụng @Transactional để cập nhật số dư ví (INCOME: +, EXPENSE: -, TRANSFER: chuyển giữa 2 ví).
 * 3. Chặn âm số dư nếu không phải thẻ CREDIT_CARD.
 * 4. Lưu vết balance_after và lưu Transaction vào CSDL.
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

    public Transaction createTransaction(Long userId, TransactionRequest request) {
        log.info("[TODO - AN] Cài đặt chức năng ghi nhận giao dịch cho userId: {}", userId);
        // TODO: Nguyễn Trường An cài đặt logic nghiệp vụ tại đây
        return null;
    }

    public Page<Transaction> getUserTransactions(Long userId, Pageable pageable) {
        log.info("[TODO - AN] Cài đặt chức năng lấy lịch sử giao dịch phân trang cho userId: {}", userId);
        // TODO: Nguyễn Trường An cài đặt logic truy vấn tại đây
        return Page.empty(pageable);
    }
}
