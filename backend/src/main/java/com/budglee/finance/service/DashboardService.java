package com.budglee.finance.service;

import com.budglee.finance.dto.DashboardSummaryResponse;
import com.budglee.finance.entity.Budget;
import com.budglee.finance.entity.Transaction;
import com.budglee.finance.entity.TransactionType;
import com.budglee.finance.repository.BudgetRepository;
import com.budglee.finance.repository.TransactionRepository;
import com.budglee.finance.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
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
 * Mã công việc: DUAN-42
 * Nhánh phát triển: 'thanh'
 *
 * Tính năng chính:
 * 1. Thống kê tổng số dư, thu/chi tháng, tỷ lệ ngân sách và phân bổ danh mục.
 * 2. Phân tích biến động chi tiêu theo 4 tuần thực tế trong tháng từ CSDL.
 * 3. Hỗ trợ biểu đồ xu hướng dòng tiền đa kỳ (DAILY, WEEKLY, MONTHLY, YEARLY, CUSTOM).
 * 4. Tích hợp Redis Caching (@Cacheable) có TTL và cơ chế Fallback sang MySQL khi Redis lỗi.
 * 5. Cung cấp API dọn cache (@CacheEvict) khi phát sinh giao dịch mới.
 * =========================================================================
 */
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
            BigDecimal amount = row[1] != null ? (BigDecimal) row[1] : BigDecimal.ZERO;
            categoryExpenses.put(catName, amount);
        }

        // 4. Biến động chi tiêu theo 4 tuần thực tế trong tháng (Weekly Spent Trends)
        List<Transaction> monthTransactions = transactionRepository.findByUserIdAndTransactionDateBetween(
                userId, startDateTime, endDateTime);

        BigDecimal w1 = BigDecimal.ZERO;
        BigDecimal w2 = BigDecimal.ZERO;
        BigDecimal w3 = BigDecimal.ZERO;
        BigDecimal w4 = BigDecimal.ZERO;

        if (monthTransactions != null) {
            for (Transaction t : monthTransactions) {
                if (t.getTransactionType() == TransactionType.EXPENSE && t.getAmount() != null && t.getTransactionDate() != null) {
                    int day = t.getTransactionDate().getDayOfMonth();
                    if (day <= 7) {
                        w1 = w1.add(t.getAmount());
                    } else if (day <= 14) {
                        w2 = w2.add(t.getAmount());
                    } else if (day <= 21) {
                        w3 = w3.add(t.getAmount());
                    } else {
                        w4 = w4.add(t.getAmount());
                    }
                }
            }
        }

        List<DashboardSummaryResponse.ChartDataPoint> spentTrends = new ArrayList<>();
        spentTrends.add(new DashboardSummaryResponse.ChartDataPoint("Tuần 1", w1));
        spentTrends.add(new DashboardSummaryResponse.ChartDataPoint("Tuần 2", w2));
        spentTrends.add(new DashboardSummaryResponse.ChartDataPoint("Tuần 3", w3));
        spentTrends.add(new DashboardSummaryResponse.ChartDataPoint("Tuần 4", w4));

        // 5. Tính hạn mức còn lại và tỷ lệ chi tiêu theo ngân sách đã thiết lập
        List<Budget> userBudgets = budgetRepository.findByUserIdAndPeriodMonthAndPeriodYear(userId, month, year);
        BigDecimal totalBudgetLimit = BigDecimal.ZERO;
        if (userBudgets != null) {
            for (Budget b : userBudgets) {
                if (b.getAmountLimit() != null) {
                    totalBudgetLimit = totalBudgetLimit.add(b.getAmountLimit());
                }
            }
        }

        BigDecimal leftToSpend;
        Double spendingPercentage;

        if (totalBudgetLimit.compareTo(BigDecimal.ZERO) > 0) {
            leftToSpend = totalBudgetLimit.subtract(monthlySpending);
            spendingPercentage = monthlySpending.divide(totalBudgetLimit, 4, RoundingMode.HALF_UP).doubleValue() * 100;
        } else if (monthlyIncome.compareTo(BigDecimal.ZERO) > 0) {
            leftToSpend = monthlyIncome.subtract(monthlySpending);
            spendingPercentage = monthlySpending.divide(monthlyIncome, 4, RoundingMode.HALF_UP).doubleValue() * 100;
        } else {
            leftToSpend = monthlySpending.negate();
            spendingPercentage = 0.0;
        }

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
     * Thống kê dòng tiền chi tiết theo kỳ (Daily, Weekly, Monthly, Yearly, Custom)
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "dashboardTrends", key = "#userId + '_' + #timeframe", unless = "#result == null")
    public List<DashboardSummaryResponse.ChartDataPoint> getCashFlowTrends(Long userId, String timeframe) {
        log.info("[THÀNH - DASHBOARD] Thống kê dòng tiền theo kỳ '{}' cho userId: {}", timeframe, userId);

        String tf = timeframe != null ? timeframe.toUpperCase() : "MONTHLY";
        List<DashboardSummaryResponse.ChartDataPoint> points = new ArrayList<>();
        LocalDate now = LocalDate.now();

        switch (tf) {
            case "DAILY": {
                LocalDate monday = now.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
                LocalDateTime start = monday.atStartOfDay();
                LocalDateTime end = monday.plusDays(6).atTime(LocalTime.MAX);
                List<Transaction> txs = transactionRepository.findByUserIdAndTransactionDateBetween(userId, start, end);
                Map<java.time.DayOfWeek, BigDecimal> dayMap = new EnumMap<>(java.time.DayOfWeek.class);
                if (txs != null) {
                    for (Transaction t : txs) {
                        if (t.getTransactionType() == TransactionType.EXPENSE && t.getAmount() != null && t.getTransactionDate() != null) {
                            dayMap.merge(t.getTransactionDate().getDayOfWeek(), t.getAmount(), BigDecimal::add);
                        }
                    }
                }
                points.add(new DashboardSummaryResponse.ChartDataPoint("Thứ 2", dayMap.getOrDefault(java.time.DayOfWeek.MONDAY, BigDecimal.ZERO)));
                points.add(new DashboardSummaryResponse.ChartDataPoint("Thứ 3", dayMap.getOrDefault(java.time.DayOfWeek.TUESDAY, BigDecimal.ZERO)));
                points.add(new DashboardSummaryResponse.ChartDataPoint("Thứ 4", dayMap.getOrDefault(java.time.DayOfWeek.WEDNESDAY, BigDecimal.ZERO)));
                points.add(new DashboardSummaryResponse.ChartDataPoint("Thứ 5", dayMap.getOrDefault(java.time.DayOfWeek.THURSDAY, BigDecimal.ZERO)));
                points.add(new DashboardSummaryResponse.ChartDataPoint("Thứ 6", dayMap.getOrDefault(java.time.DayOfWeek.FRIDAY, BigDecimal.ZERO)));
                points.add(new DashboardSummaryResponse.ChartDataPoint("Thứ 7", dayMap.getOrDefault(java.time.DayOfWeek.SATURDAY, BigDecimal.ZERO)));
                points.add(new DashboardSummaryResponse.ChartDataPoint("Chủ nhật", dayMap.getOrDefault(java.time.DayOfWeek.SUNDAY, BigDecimal.ZERO)));
                break;
            }
            case "WEEKLY": {
                LocalDate firstDay = now.withDayOfMonth(1);
                LocalDateTime start = firstDay.atStartOfDay();
                LocalDateTime end = firstDay.withDayOfMonth(firstDay.lengthOfMonth()).atTime(LocalTime.MAX);
                List<Transaction> txs = transactionRepository.findByUserIdAndTransactionDateBetween(userId, start, end);
                BigDecimal w1 = BigDecimal.ZERO;
                BigDecimal w2 = BigDecimal.ZERO;
                BigDecimal w3 = BigDecimal.ZERO;
                BigDecimal w4 = BigDecimal.ZERO;
                if (txs != null) {
                    for (Transaction t : txs) {
                        if (t.getTransactionType() == TransactionType.EXPENSE && t.getAmount() != null && t.getTransactionDate() != null) {
                            int day = t.getTransactionDate().getDayOfMonth();
                            if (day <= 7) w1 = w1.add(t.getAmount());
                            else if (day <= 14) w2 = w2.add(t.getAmount());
                            else if (day <= 21) w3 = w3.add(t.getAmount());
                            else w4 = w4.add(t.getAmount());
                        }
                    }
                }
                points.add(new DashboardSummaryResponse.ChartDataPoint("Tuần 1", w1));
                points.add(new DashboardSummaryResponse.ChartDataPoint("Tuần 2", w2));
                points.add(new DashboardSummaryResponse.ChartDataPoint("Tuần 3", w3));
                points.add(new DashboardSummaryResponse.ChartDataPoint("Tuần 4", w4));
                break;
            }
            case "YEARLY": {
                int currentYear = now.getYear();
                for (int y = currentYear - 3; y <= currentYear; y++) {
                    LocalDateTime start = LocalDate.of(y, 1, 1).atStartOfDay();
                    LocalDateTime end = LocalDate.of(y, 12, 31).atTime(LocalTime.MAX);
                    BigDecimal total = transactionRepository.getTotalAmountByTypeAndPeriod(userId, TransactionType.EXPENSE, start, end);
                    points.add(new DashboardSummaryResponse.ChartDataPoint(String.valueOf(y), total != null ? total : BigDecimal.ZERO));
                }
                break;
            }
            case "CUSTOM": {
                for (int i = 4; i >= 0; i--) {
                    LocalDate d = now.minusDays(i * 3L);
                    LocalDateTime start = d.atStartOfDay();
                    LocalDateTime end = d.atTime(LocalTime.MAX);
                    BigDecimal total = transactionRepository.getTotalAmountByTypeAndPeriod(userId, TransactionType.EXPENSE, start, end);
                    String label = String.format("%02d/%02d", d.getDayOfMonth(), d.getMonthValue());
                    points.add(new DashboardSummaryResponse.ChartDataPoint(label, total != null ? total : BigDecimal.ZERO));
                }
                break;
            }
            case "MONTHLY":
            default: {
                for (int i = 3; i >= 0; i--) {
                    LocalDate d = now.minusMonths(i);
                    LocalDate first = d.withDayOfMonth(1);
                    LocalDate last = d.withDayOfMonth(d.lengthOfMonth());
                    BigDecimal total = transactionRepository.getTotalAmountByTypeAndPeriod(
                            userId, TransactionType.EXPENSE, first.atStartOfDay(), last.atTime(LocalTime.MAX));
                    points.add(new DashboardSummaryResponse.ChartDataPoint("Tháng " + d.getMonthValue(), total != null ? total : BigDecimal.ZERO));
                }
                break;
            }
        }
        return points;
    }

    /**
     * Dọn dẹp cache Dashboard khi có giao dịch hoặc ví mới được tạo/sửa đổi
     */
    @CacheEvict(value = {"dashboardSummary", "dashboardTrends"}, allEntries = true)
    public void evictDashboardCache() {
        log.info("[THÀNH - DASHBOARD] Đã dọn dẹp cache Dashboard để cập nhật số liệu mới nhất.");
    }
}
