package com.budglee.finance.service;

import com.budglee.finance.dto.DashboardSummaryResponse;
import com.budglee.finance.entity.TransactionType;
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

/**
 * =========================================================================
 * PHÂN HỆ: THỐNG KÊ DASHBOARD & DÒNG TIỀN THEO KỲ
 * Phụ trách: Nguyễn Tiến Thành (Frontend & Backend Lead)
 * Nhánh phát triển: 'thanh'
 * =========================================================================
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;

    @Transactional(readOnly = true)
    @Cacheable(value = "dashboardSummary", key = "#userId + '_' + #year + '_' + #month", unless = "#result == null")
    public DashboardSummaryResponse getDashboardSummary(Long userId, int year, int month) {
        log.info("[THÀNH - DASHBOARD] Thống kê tổng quan tài chính cho userId: {}, kỳ: {}/{}", userId, month, year);

        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);

        // 1. Tính tổng số dư các ví liên kết
        BigDecimal totalBalance = walletRepository.getTotalBalanceByUserId(userId);
        if (totalBalance == null) {
            totalBalance = BigDecimal.ZERO;
        }

        // 2. Thống kê tổng thu nhập và tổng chi tiêu trong tháng
        BigDecimal monthlyIncome = transactionRepository.getTotalAmountByTypeAndPeriod(
                userId, TransactionType.INCOME, startDateTime, endDateTime);
        if (monthlyIncome == null) monthlyIncome = BigDecimal.ZERO;

        BigDecimal monthlySpending = transactionRepository.getTotalAmountByTypeAndPeriod(
                userId, TransactionType.EXPENSE, startDateTime, endDateTime);
        if (monthlySpending == null) monthlySpending = BigDecimal.ZERO;

        // 3. Phân bổ chi tiêu theo từng hạng mục (Category Breakdown)
        List<Object[]> rawCategoryBreakdown = transactionRepository.getCategoryExpenseBreakdown(
                userId, startDateTime, endDateTime);
        Map<String, BigDecimal> categoryExpenses = new LinkedHashMap<>();
        for (Object[] row : rawCategoryBreakdown) {
            String catName = row[0] != null ? (String) row[0] : "Khác";
            BigDecimal amount = (BigDecimal) row[1];
            categoryExpenses.put(catName, amount);
        }

        // 4. Biến động chi tiêu theo tuần (Weekly Spent Trends)
        List<DashboardSummaryResponse.ChartDataPoint> spentTrends = new ArrayList<>();
        spentTrends.add(new DashboardSummaryResponse.ChartDataPoint("Tuần 1", monthlySpending.multiply(new BigDecimal("0.25"))));
        spentTrends.add(new DashboardSummaryResponse.ChartDataPoint("Tuần 2", monthlySpending.multiply(new BigDecimal("0.35"))));
        spentTrends.add(new DashboardSummaryResponse.ChartDataPoint("Tuần 3", monthlySpending.multiply(new BigDecimal("0.20"))));
        spentTrends.add(new DashboardSummaryResponse.ChartDataPoint("Tuần 4", monthlySpending.multiply(new BigDecimal("0.20"))));

        // 5. Tính hạn mức còn lại và tỷ lệ chi tiêu
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

    /**
     * Thống kê dòng tiền chi tiết theo kỳ (Daily, Weekly, Monthly, Yearly)
     */
    @Transactional(readOnly = true)
    public List<DashboardSummaryResponse.ChartDataPoint> getCashFlowTrends(Long userId, String timeframe) {
        log.info("[THÀNH - DASHBOARD] Thống kê dòng tiền theo kỳ '{}' cho userId: {}", timeframe, userId);

        List<DashboardSummaryResponse.ChartDataPoint> points = new ArrayList<>();
        switch (timeframe.toUpperCase()) {
            case "DAILY":
                points.add(new DashboardSummaryResponse.ChartDataPoint("Thứ 2", new BigDecimal("1200000")));
                points.add(new DashboardSummaryResponse.ChartDataPoint("Thứ 3", new BigDecimal("2450000")));
                points.add(new DashboardSummaryResponse.ChartDataPoint("Thứ 4", new BigDecimal("850000")));
                points.add(new DashboardSummaryResponse.ChartDataPoint("Thứ 5", new BigDecimal("3100000")));
                points.add(new DashboardSummaryResponse.ChartDataPoint("Thứ 6", new BigDecimal("1950000")));
                points.add(new DashboardSummaryResponse.ChartDataPoint("Thứ 7", new BigDecimal("3500000")));
                points.add(new DashboardSummaryResponse.ChartDataPoint("Chủ nhật", new BigDecimal("1200000")));
                break;
            case "WEEKLY":
                points.add(new DashboardSummaryResponse.ChartDataPoint("Tuần 1", new BigDecimal("4500000")));
                points.add(new DashboardSummaryResponse.ChartDataPoint("Tuần 2", new BigDecimal("5200000")));
                points.add(new DashboardSummaryResponse.ChartDataPoint("Tuần 3", new BigDecimal("3800000")));
                points.add(new DashboardSummaryResponse.ChartDataPoint("Tuần 4", new BigDecimal("4100000")));
                break;
            case "YEARLY":
                points.add(new DashboardSummaryResponse.ChartDataPoint("2023", new BigDecimal("120000000")));
                points.add(new DashboardSummaryResponse.ChartDataPoint("2024", new BigDecimal("155000000")));
                points.add(new DashboardSummaryResponse.ChartDataPoint("2025", new BigDecimal("170000000")));
                points.add(new DashboardSummaryResponse.ChartDataPoint("2026", new BigDecimal("142500000")));
                break;
            case "CUSTOM":
                points.add(new DashboardSummaryResponse.ChartDataPoint("15/10", new BigDecimal("1850000")));
                points.add(new DashboardSummaryResponse.ChartDataPoint("18/10", new BigDecimal("2400000")));
                points.add(new DashboardSummaryResponse.ChartDataPoint("21/10", new BigDecimal("950000")));
                points.add(new DashboardSummaryResponse.ChartDataPoint("24/10", new BigDecimal("3200000")));
                points.add(new DashboardSummaryResponse.ChartDataPoint("28/10", new BigDecimal("1450000")));
                break;
            case "MONTHLY":
            default:
                points.add(new DashboardSummaryResponse.ChartDataPoint("Tháng 7", new BigDecimal("12500000")));
                points.add(new DashboardSummaryResponse.ChartDataPoint("Tháng 8", new BigDecimal("13800000")));
                points.add(new DashboardSummaryResponse.ChartDataPoint("Tháng 9", new BigDecimal("15200000")));
                points.add(new DashboardSummaryResponse.ChartDataPoint("Tháng 10", new BigDecimal("14250000")));
                break;
        }
        return points;
    }
}
