package com.budglee.finance.service;

import com.budglee.finance.dto.DashboardSummaryResponse;
import com.budglee.finance.entity.TransactionType;
import com.budglee.finance.repository.BudgetRepository;
import com.budglee.finance.repository.TransactionRepository;
import com.budglee.finance.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;

    @Transactional(readOnly = true)
    @Cacheable(value = "dashboardSummary", key = "#userId + '_' + #year + '_' + #month", unless = "#result == null")
    public DashboardSummaryResponse getDashboardSummary(Long userId, int year, int month) {
        log.info("Computing Dashboard Summary from database for userId: {}, {}-{}", userId, year, month);

        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);

        // 1. Total Balance
        BigDecimal totalBalance = walletRepository.getTotalBalanceByUserId(userId);

        // 2. Monthly Income & Expense
        BigDecimal monthlyIncome = transactionRepository.getTotalAmountByTypeAndPeriod(
                userId, TransactionType.INCOME, startDateTime, endDateTime);
        BigDecimal monthlySpending = transactionRepository.getTotalAmountByTypeAndPeriod(
                userId, TransactionType.EXPENSE, startDateTime, endDateTime);

        // 3. Category Expenses
        List<Object[]> rawCategoryBreakdown = transactionRepository.getCategoryExpenseBreakdown(
                userId, startDateTime, endDateTime);
        Map<String, BigDecimal> categoryExpenses = new HashMap<>();
        for (Object[] row : rawCategoryBreakdown) {
            String catName = row[0] != null ? (String) row[0] : "Khác";
            BigDecimal amount = (BigDecimal) row[1];
            categoryExpenses.put(catName, amount);
        }

        // 4. Sample Trend points for Recharts Line Chart
        List<DashboardSummaryResponse.ChartDataPoint> spentTrends = new ArrayList<>();
        spentTrends.add(new DashboardSummaryResponse.ChartDataPoint("Tuần 1", monthlySpending.multiply(new BigDecimal("0.25"))));
        spentTrends.add(new DashboardSummaryResponse.ChartDataPoint("Tuần 2", monthlySpending.multiply(new BigDecimal("0.35"))));
        spentTrends.add(new DashboardSummaryResponse.ChartDataPoint("Tuần 3", monthlySpending.multiply(new BigDecimal("0.20"))));
        spentTrends.add(new DashboardSummaryResponse.ChartDataPoint("Tuần 4", monthlySpending.multiply(new BigDecimal("0.20"))));

        BigDecimal leftToSpend = monthlyIncome.subtract(monthlySpending);
        Double spendingPercentage = monthlyIncome.compareTo(BigDecimal.ZERO) > 0
                ? monthlySpending.divide(monthlyIncome, 4, RoundingMode.HALF_UP).doubleValue() * 100
                : 0.0;

        return DashboardSummaryResponse.builder()
                .totalBalance(totalBalance)
                .monthlyIncome(monthlyIncome)
                .monthlySpending(monthlySpending)
                .leftToSpend(leftToSpend)
                .spendingPercentageOfBudget(spendingPercentage)
                .categoryExpenses(categoryExpenses)
                .spentTrends(spentTrends)
                .build();
    }
}
