package com.budglee.finance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;

/**
 * DTO phản hồi kết quả đánh giá Điểm sức khỏe tài chính cá nhân (Financial Health Score 0 - 100)
 * Phụ trách: Bàng Trọng Tú (Database & Data Lead) - Sprint 4
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialHealthResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    /**
     * Tổng điểm sức khỏe tài chính (0 - 100)
     */
    private int score;

    /**
     * Phân hạng mã: EXCELLENT, GOOD, FAIR, AT_RISK
     */
    private String rating;

    /**
     * Nhãn hiển thị tiếng Việt: Xuất sắc, Tốt, Trung bình, Báo động
     */
    private String ratingLabel;

    /**
     * Đánh giá tóm tắt tổng quan
     */
    private String summary;

    /**
     * Chi tiết điểm số và dữ liệu của 4 trụ cột
     */
    private HealthBreakdown breakdown;

    /**
     * Danh sách lời khuyên / khuyến nghị hành động thiết thực
     */
    private List<String> advice;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HealthBreakdown implements Serializable {
        private static final long serialVersionUID = 1L;

        // Trụ cột 1: Tỷ lệ tiết kiệm (Tối đa 30 điểm)
        private int savingsScore;
        private Double savingsRatePercentage;
        private BigDecimal monthlyIncome;
        private BigDecimal monthlySpending;

        // Trụ cột 2: Kỷ luật ngân sách (Tối đa 30 điểm)
        private int budgetScore;
        private Double budgetUsedPercentage;
        private BigDecimal totalBudgetLimit;

        // Trụ cột 3: Quỹ đệm dự phòng an toàn (Tối đa 25 điểm)
        private int emergencyFundScore;
        private Double emergencyMonthsCovered;
        private BigDecimal totalBalance;

        // Trụ cột 4: Tiến độ tích lũy mục tiêu (Tối đa 15 điểm)
        private int goalScore;
        private int activeGoalsCount;
        private Double averageGoalProgress;
    }
}

