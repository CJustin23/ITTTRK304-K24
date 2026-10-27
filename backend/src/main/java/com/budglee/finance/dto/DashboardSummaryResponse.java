package com.budglee.finance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private BigDecimal totalBalance;
    private BigDecimal monthlyIncome;
    private BigDecimal monthlySpending;
    private BigDecimal leftToSpend;
    private Double spendingPercentageOfBudget;

    // Phân bổ chi tiêu theo danh mục
    private Map<String, BigDecimal> categoryExpenses;

    // Danh sách điểm trên biểu đồ chi tiêu
    private List<ChartDataPoint> spentTrends;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChartDataPoint implements Serializable {
        private String label; // "Mon", "Tue" hoặc "Jan", "Feb"
        private BigDecimal amount;
    }
}
