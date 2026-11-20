package com.budglee.finance.service;

import com.budglee.finance.dto.FinancialHealthResponse;
import com.budglee.finance.entity.Budget;
import com.budglee.finance.entity.GoalStatus;
import com.budglee.finance.entity.SavingGoal;
import com.budglee.finance.entity.TransactionType;
import com.budglee.finance.repository.BudgetRepository;
import com.budglee.finance.repository.SavingGoalRepository;
import com.budglee.finance.repository.TransactionRepository;
import com.budglee.finance.repository.WalletRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

/**
 * =========================================================================
 * BỘ KIỂM THỬ ĐƠN VỊ CHO FINANCIAL HEALTH SERVICE (ĐIỂM SỨC KHỎE TÀI CHÍNH)
 * Phụ trách: Bàng Trọng Tú (Database & Data Lead) - Sprint 4
 * =========================================================================
 */
@ExtendWith(MockitoExtension.class)
class FinancialHealthServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private WalletRepository walletRepository;

    @Mock
    private BudgetRepository budgetRepository;

    @Mock
    private SavingGoalRepository savingGoalRepository;

    @InjectMocks
    private FinancialHealthService financialHealthService;

    @Test
    @DisplayName("Kiểm tra tính điểm khi tài chính xuất sắc: Thu > Chi, ngân sách an toàn, số dư lớn, có mục tiêu")
    void calculateFinancialHealth_WhenFinancesAreExcellent_ShouldReturnHighScore() {
        Long userId = 1L;
        int year = 2026;
        int month = 11;

        // Thu: 50M, Chi: 20M -> Tiết kiệm 60% (>= 20% -> 30đ)
        when(transactionRepository.getTotalAmountByTypeAndPeriod(eq(userId), eq(TransactionType.INCOME), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(new BigDecimal("50000000"));
        when(transactionRepository.getTotalAmountByTypeAndPeriod(eq(userId), eq(TransactionType.EXPENSE), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(new BigDecimal("20000000"));

        // Số dư ví: 100M -> 100M / 20M = 5 tháng (>= 3 tháng -> 25đ)
        when(walletRepository.getTotalBalanceByUserId(userId))
                .thenReturn(new BigDecimal("100000000"));

        // Ngân sách: 25M -> Chi 20M = 80% (<= 80% -> 30đ)
        Budget budget = Budget.builder()
                .amountLimit(new BigDecimal("25000000"))
                .periodMonth(month)
                .periodYear(year)
                .build();
        when(budgetRepository.findByUserIdAndPeriodMonthAndPeriodYear(userId, month, year))
                .thenReturn(List.of(budget));

        // Mục tiêu tích lũy: có 1 mục tiêu đang nạp tiền -> 15đ
        SavingGoal goal = SavingGoal.builder()
                .targetAmount(new BigDecimal("100000000"))
                .currentAmount(new BigDecimal("30000000"))
                .status(GoalStatus.IN_PROGRESS)
                .build();
        when(savingGoalRepository.findByUserId(userId))
                .thenReturn(List.of(goal));

        // Thực thi
        FinancialHealthResponse response = financialHealthService.calculateFinancialHealth(userId, year, month);

        // Kiểm tra
        assertThat(response).isNotNull();
        assertThat(response.getScore()).isEqualTo(100);
        assertThat(response.getRating()).isEqualTo("EXCELLENT");
        assertThat(response.getRatingLabel()).isEqualTo("Xuất sắc");
        assertThat(response.getBreakdown().getSavingsScore()).isEqualTo(30);
        assertThat(response.getBreakdown().getBudgetScore()).isEqualTo(30);
        assertThat(response.getBreakdown().getEmergencyFundScore()).isEqualTo(25);
        assertThat(response.getBreakdown().getGoalScore()).isEqualTo(15);
        assertThat(response.getAdvice()).isNotEmpty();
    }

    @Test
    @DisplayName("Kiểm tra tính điểm khi bội chi và vỡ ngân sách: Chi > Thu, vượt ngân sách, số dư cạn")
    void calculateFinancialHealth_WhenOverspendingAndOverBudget_ShouldReturnAtRiskRating() {
        Long userId = 2L;
        int year = 2026;
        int month = 11;

        // Thu: 10M, Chi: 15M -> Tiết kiệm âm (0đ)
        when(transactionRepository.getTotalAmountByTypeAndPeriod(eq(userId), eq(TransactionType.INCOME), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(new BigDecimal("10000000"));
        when(transactionRepository.getTotalAmountByTypeAndPeriod(eq(userId), eq(TransactionType.EXPENSE), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(new BigDecimal("15000000"));

        // Số dư ví: 500k -> 500k / 15M = 0.03 tháng (< 1 tháng -> 8đ)
        when(walletRepository.getTotalBalanceByUserId(userId))
                .thenReturn(new BigDecimal("500000"));

        // Ngân sách: 10M -> Chi 15M (150% > 115% -> 0đ)
        Budget budget = Budget.builder()
                .amountLimit(new BigDecimal("10000000"))
                .periodMonth(month)
                .periodYear(year)
                .build();
        when(budgetRepository.findByUserIdAndPeriodMonthAndPeriodYear(userId, month, year))
                .thenReturn(List.of(budget));

        // Không có mục tiêu tiết kiệm nào -> 5đ
        when(savingGoalRepository.findByUserId(userId))
                .thenReturn(Collections.emptyList());

        FinancialHealthResponse response = financialHealthService.calculateFinancialHealth(userId, year, month);

        assertThat(response).isNotNull();
        assertThat(response.getScore()).isEqualTo(13); // 0 + 0 + 8 + 5 = 13
        assertThat(response.getRating()).isEqualTo("AT_RISK");
        assertThat(response.getRatingLabel()).isEqualTo("Báo động");
        assertThat(response.getAdvice()).isNotEmpty();
    }

    @Test
    @DisplayName("Kiểm tra người dùng mới toanh chưa có giao dịch: không lỗi chia cho 0 và trả về điểm cơ bản an toàn")
    void calculateFinancialHealth_WhenNewUserWithoutData_ShouldHandleGracefully() {
        Long userId = 3L;
        int year = 2026;
        int month = 11;

        when(transactionRepository.getTotalAmountByTypeAndPeriod(eq(userId), any(TransactionType.class), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(BigDecimal.ZERO);
        when(walletRepository.getTotalBalanceByUserId(userId))
                .thenReturn(BigDecimal.ZERO);
        when(budgetRepository.findByUserIdAndPeriodMonthAndPeriodYear(userId, month, year))
                .thenReturn(Collections.emptyList());
        when(savingGoalRepository.findByUserId(userId))
                .thenReturn(Collections.emptyList());

        FinancialHealthResponse response = financialHealthService.calculateFinancialHealth(userId, year, month);

        assertThat(response).isNotNull();
        assertThat(response.getScore()).isBetween(0, 100);
        assertThat(response.getBreakdown().getMonthlyIncome()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.getBreakdown().getMonthlySpending()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.getAdvice()).isNotEmpty();
    }
}

