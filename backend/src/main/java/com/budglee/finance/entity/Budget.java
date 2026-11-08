package com.budglee.finance.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "budgets", indexes = {
        @Index(name = "idx_budgets_period", columnList = "user_id,period_year,period_month")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Budget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(name = "amount_limit", nullable = false, precision = 15, scale = 2)
    private BigDecimal amountLimit;

    @Column(name = "spent_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal spentAmount = BigDecimal.ZERO;

    @Column(name = "period_month", nullable = false)
    private Integer periodMonth;

    @Column(name = "period_year", nullable = false)
    private Integer periodYear;

    @Column(name = "alert_threshold", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal alertThreshold = new BigDecimal("80.00");

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Trạng thái cảnh báo suy ra từ số đã chi và hạn mức, trả kèm response để frontend
     * không phải tự tính ngưỡng.
     */
    public String getAlertLevel() {
        return alertLevelOf(spentAmount, amountLimit, alertThreshold);
    }

    /**
     * Công thức ngưỡng đặt ở một chỗ vì cả entity (POST) lẫn DTO đọc (GET) đều phải trả cùng
     * một giá trị cảnh báo cho cùng một số chi.
     */
    public static String alertLevelOf(BigDecimal spent, BigDecimal limit, BigDecimal threshold) {
        if (limit == null || limit.compareTo(BigDecimal.ZERO) <= 0 || spent == null) {
            return "OK";
        }
        double ratio = spent.doubleValue() / limit.doubleValue() * 100.0;
        double thresholdValue = threshold == null ? 80.0 : threshold.doubleValue();
        if (ratio >= 100.0) {
            return "EXCEEDED";
        }
        return ratio >= thresholdValue ? "WARNING" : "OK";
    }
}
