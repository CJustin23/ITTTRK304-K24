package com.budglee.finance.repository;

import com.budglee.finance.entity.Transaction;
import com.budglee.finance.entity.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    Page<Transaction> findByUserIdOrderByTransactionDateDesc(Long userId, Pageable pageable);

    Page<Transaction> findByWalletIdInOrderByTransactionDateDesc(java.util.Collection<Long> walletIds, Pageable pageable);

    boolean existsByCategoryId(Long categoryId);

    boolean existsByWalletId(Long walletId);

    List<Transaction> findByUserIdAndTransactionDateBetween(
            Long userId, LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Hai bản ghi của một lần chuyển ví (linked_transaction_id không rỗng) không phải thu nhập hay
     * chi tiêu, nên bị loại khỏi mọi con số tổng hợp.
     */
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
           "WHERE t.user.id = :userId AND t.transactionType = :type " +
           "AND t.linkedTransactionId IS NULL " +
           "AND t.transactionDate BETWEEN :startDate AND :endDate")
    BigDecimal getTotalAmountByTypeAndPeriod(
            @Param("userId") Long userId,
            @Param("type") TransactionType type,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COALESCE(c.name, 'Khác'), SUM(t.amount) FROM Transaction t " +
           "LEFT JOIN t.category c " +
           "WHERE t.user.id = :userId AND t.transactionType = 'EXPENSE' " +
           "AND t.linkedTransactionId IS NULL " +
           "AND t.transactionDate BETWEEN :startDate AND :endDate " +
           "GROUP BY c.name")
    List<Object[]> getCategoryExpenseBreakdown(
            @Param("userId") Long userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    /**
     * Tối ưu hóa truy vấn dòng tiền 4 tuần (Sprint 4 - Tú):
     * Gom nhóm và tính tổng chi tiêu 4 tuần trực tiếp bằng SQL Aggregate Function (CASE WHEN ... DAY),
     * thay thế việc load toàn bộ Entity Transaction vào RAM của Backend.
     */
    @Query("SELECT " +
           "COALESCE(SUM(CASE WHEN FUNCTION('DAY', t.transactionDate) <= 7 THEN t.amount ELSE 0 END), 0), " +
           "COALESCE(SUM(CASE WHEN FUNCTION('DAY', t.transactionDate) > 7 AND FUNCTION('DAY', t.transactionDate) <= 14 THEN t.amount ELSE 0 END), 0), " +
           "COALESCE(SUM(CASE WHEN FUNCTION('DAY', t.transactionDate) > 14 AND FUNCTION('DAY', t.transactionDate) <= 21 THEN t.amount ELSE 0 END), 0), " +
           "COALESCE(SUM(CASE WHEN FUNCTION('DAY', t.transactionDate) > 21 THEN t.amount ELSE 0 END), 0) " +
           "FROM Transaction t " +
           "WHERE t.user.id = :userId AND t.transactionType = 'EXPENSE' " +
           "AND t.linkedTransactionId IS NULL " +
           "AND t.transactionDate BETWEEN :startDate AND :endDate")
    List<Object[]> getWeeklyExpenseBreakdown(
            @Param("userId") Long userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    /**
     * Tối ưu hóa tính chi tiêu theo ngân sách (Sprint 4 - Tú):
     * Tổng hợp số tiền chi theo categoryId trực tiếp bằng SQL GROUP BY,
     * loại bỏ việc duyệt stream từng Transaction trên Backend.
     */
    @Query("SELECT t.category.id, SUM(t.amount) FROM Transaction t " +
           "WHERE t.user.id = :userId AND t.transactionType = 'EXPENSE' " +
           "AND t.linkedTransactionId IS NULL " +
           "AND t.category IS NOT NULL " +
           "AND t.transactionDate BETWEEN :startDate AND :endDate " +
           "GROUP BY t.category.id")
    List<Object[]> getCategoryExpenseSums(
            @Param("userId") Long userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);
}
