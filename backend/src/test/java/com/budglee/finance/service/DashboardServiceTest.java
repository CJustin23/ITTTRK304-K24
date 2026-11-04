package com.budglee.finance.service;

import com.budglee.finance.dto.DashboardSummaryResponse;
import com.budglee.finance.entity.*;
import com.budglee.finance.repository.BudgetRepository;
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
import static org.mockito.Mockito.*;

/**
 * =========================================================================
 * BỘ KIỂM THỬ ĐƠN VỊ CHO DASHBOARD SERVICE & THỐNG KÊ (DUAN-42)
 * Phụ trách: Nguyễn Tiến Thành
 * =========================================================================
 */
@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private WalletRepository walletRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private BudgetRepository budgetRepository;

    @InjectMocks
    private DashboardService dashboardService;

    @Test
    @DisplayName("DUAN-42: Thống kê Dashboard tính toán chính xác tổng số dư, thu, chi và ngân sách")
    void getDashboardSummary_Success_CalculatesCorrectly() {
        Long userId = 1L;
        int year = 2026;
        int month = 11;

        when(walletRepository.getTotalBalanceByUserId(userId)).thenReturn(new BigDecimal("15000000"));
        when(transactionRepository.getTotalAmountByTypeAndPeriod(eq(userId), eq(TransactionType.INCOME), any(), any()))
                .thenReturn(new BigDecimal("25000000"));
        when(transactionRepository.getTotalAmountByTypeAndPeriod(eq(userId), eq(TransactionType.EXPENSE), any(), any()))
                .thenReturn(new BigDecimal("10000000"));

        List<Object[]> categoryBreakdown = List.of(
                new Object[]{"Ăn uống & Cà phê", new BigDecimal("6000000")},
                new Object[]{"Mua sắm & Gia đình", new BigDecimal("4000000")}
        );
        when(transactionRepository.getCategoryExpenseBreakdown(eq(userId), any(), any()))
                .thenReturn(categoryBreakdown);

        // Giao dịch 4 tuần
        Transaction txW1 = Transaction.builder()
                .amount(new BigDecimal("2500000"))
                .transactionType(TransactionType.EXPENSE)
                .transactionDate(LocalDateTime.of(2026, 11, 3, 10, 0))
                .build();
        Transaction txW2 = Transaction.builder()
                .amount(new BigDecimal("3500000"))
                .transactionType(TransactionType.EXPENSE)
                .transactionDate(LocalDateTime.of(2026, 11, 10, 10, 0))
                .build();
        Transaction txW3 = Transaction.builder()
                .amount(new BigDecimal("2000000"))
                .transactionType(TransactionType.EXPENSE)
                .transactionDate(LocalDateTime.of(2026, 11, 18, 10, 0))
                .build();
        Transaction txW4 = Transaction.builder()
                .amount(new BigDecimal("2000000"))
                .transactionType(TransactionType.EXPENSE)
                .transactionDate(LocalDateTime.of(2026, 11, 25, 10, 0))
                .build();

        when(transactionRepository.findByUserIdAndTransactionDateBetween(eq(userId), any(), any()))
                .thenReturn(List.of(txW1, txW2, txW3, txW4));

        Budget budget = Budget.builder()
                .amountLimit(new BigDecimal("20000000"))
                .periodMonth(11)
                .periodYear(2026)
                .build();
        when(budgetRepository.findByUserIdAndPeriodMonthAndPeriodYear(userId, month, year))
                .thenReturn(List.of(budget));

        DashboardSummaryResponse response = dashboardService.getDashboardSummary(userId, year, month);

        assertThat(response).isNotNull();
        assertThat(response.getTotalBalance()).isEqualByComparingTo("15000000");
        assertThat(response.getMonthlyIncome()).isEqualByComparingTo("25000000");
        assertThat(response.getMonthlySpending()).isEqualByComparingTo("10000000");
        assertThat(response.getLeftToSpend()).isEqualByComparingTo("10000000"); // 20M limit - 10M spent
        assertThat(response.getSpendingPercentageOfBudget()).isEqualTo(50.0); // 10M / 20M = 50%

        assertThat(response.getCategoryExpenses()).hasSize(2);
        assertThat(response.getCategoryExpenses().get("Ăn uống & Cà phê")).isEqualByComparingTo("6000000");

        assertThat(response.getSpentTrends()).hasSize(4);
        assertThat(response.getSpentTrends().get(0).getAmount()).isEqualByComparingTo("2500000");
        assertThat(response.getSpentTrends().get(1).getAmount()).isEqualByComparingTo("3500000");
        assertThat(response.getSpentTrends().get(2).getAmount()).isEqualByComparingTo("2000000");
        assertThat(response.getSpentTrends().get(3).getAmount()).isEqualByComparingTo("2000000");
    }

    @Test
    @DisplayName("DUAN-42: Khi người dùng chưa thiết lập ngân sách thì tỷ lệ chi tính theo thu nhập")
    void getDashboardSummary_NoBudget_CalculatesBasedOnIncome() {
        Long userId = 2L;
        int year = 2026;
        int month = 11;

        when(walletRepository.getTotalBalanceByUserId(userId)).thenReturn(new BigDecimal("5000000"));
        when(transactionRepository.getTotalAmountByTypeAndPeriod(eq(userId), eq(TransactionType.INCOME), any(), any()))
                .thenReturn(new BigDecimal("20000000"));
        when(transactionRepository.getTotalAmountByTypeAndPeriod(eq(userId), eq(TransactionType.EXPENSE), any(), any()))
                .thenReturn(new BigDecimal("5000000"));
        when(transactionRepository.getCategoryExpenseBreakdown(eq(userId), any(), any()))
                .thenReturn(Collections.emptyList());
        when(transactionRepository.findByUserIdAndTransactionDateBetween(eq(userId), any(), any()))
                .thenReturn(Collections.emptyList());
        when(budgetRepository.findByUserIdAndPeriodMonthAndPeriodYear(userId, month, year))
                .thenReturn(Collections.emptyList());

        DashboardSummaryResponse response = dashboardService.getDashboardSummary(userId, year, month);

        assertThat(response.getLeftToSpend()).isEqualByComparingTo("15000000"); // 20M income - 5M spent
        assertThat(response.getSpendingPercentageOfBudget()).isEqualTo(25.0); // 5M / 20M = 25%
    }

    @Test
    @DisplayName("DUAN-42: Tài khoản mới (0 ví, 0 giao dịch) trả về 0 an toàn không bị lỗi NullPointer")
    void getDashboardSummary_CleanAccount_ReturnsZeroSafely() {
        Long userId = 99L;
        int year = 2026;
        int month = 11;

        when(walletRepository.getTotalBalanceByUserId(userId)).thenReturn(null);
        when(transactionRepository.getTotalAmountByTypeAndPeriod(eq(userId), eq(TransactionType.INCOME), any(), any()))
                .thenReturn(null);
        when(transactionRepository.getTotalAmountByTypeAndPeriod(eq(userId), eq(TransactionType.EXPENSE), any(), any()))
                .thenReturn(null);
        when(transactionRepository.getCategoryExpenseBreakdown(eq(userId), any(), any()))
                .thenReturn(Collections.emptyList());
        when(transactionRepository.findByUserIdAndTransactionDateBetween(eq(userId), any(), any()))
                .thenReturn(Collections.emptyList());
        when(budgetRepository.findByUserIdAndPeriodMonthAndPeriodYear(userId, month, year))
                .thenReturn(Collections.emptyList());

        DashboardSummaryResponse response = dashboardService.getDashboardSummary(userId, year, month);

        assertThat(response.getTotalBalance()).isEqualByComparingTo("0");
        assertThat(response.getMonthlyIncome()).isEqualByComparingTo("0");
        assertThat(response.getMonthlySpending()).isEqualByComparingTo("0");
        assertThat(response.getLeftToSpend()).isEqualByComparingTo("0");
        assertThat(response.getSpendingPercentageOfBudget()).isEqualTo(0.0);
        assertThat(response.getCategoryExpenses()).isEmpty();
    }

    @Test
    @DisplayName("DUAN-42: Thống kê biểu đồ xu hướng theo các chu kỳ (DAILY, WEEKLY, MONTHLY, YEARLY)")
    void getCashFlowTrends_AllTimeframes_ReturnValidData() {
        Long userId = 1L;

        List<DashboardSummaryResponse.ChartDataPoint> daily = dashboardService.getCashFlowTrends(userId, "DAILY");
        assertThat(daily).isNotEmpty();
        assertThat(daily.get(0).getLabel()).isEqualTo("Thứ 2");

        List<DashboardSummaryResponse.ChartDataPoint> weekly = dashboardService.getCashFlowTrends(userId, "WEEKLY");
        assertThat(weekly).hasSize(4);
        assertThat(weekly.get(0).getLabel()).isEqualTo("Tuần 1");

        List<DashboardSummaryResponse.ChartDataPoint> monthly = dashboardService.getCashFlowTrends(userId, "MONTHLY");
        assertThat(monthly).isNotEmpty();

        List<DashboardSummaryResponse.ChartDataPoint> yearly = dashboardService.getCashFlowTrends(userId, "YEARLY");
        assertThat(yearly).isNotEmpty();

        List<DashboardSummaryResponse.ChartDataPoint> custom = dashboardService.getCashFlowTrends(userId, "CUSTOM");
        assertThat(custom).isNotEmpty();
    }

    @Test
    @DisplayName("DUAN-42: Phương thức dọn dẹp cache evictDashboardCache chạy thành công")
    void evictDashboardCache_RunsSuccessfully() {
        dashboardService.evictDashboardCache();
        // Không throw ngoại lệ
    }
}

