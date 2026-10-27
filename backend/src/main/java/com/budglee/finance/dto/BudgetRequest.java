package com.budglee.finance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class BudgetRequest {
    private Long categoryId;

    @NotNull(message = "Hạn mức ngân sách không được để trống")
    @DecimalMin(value = "0.01", message = "Hạn mức phải lớn hơn 0")
    private BigDecimal amountLimit;

    @NotNull(message = "Tháng áp dụng không được để trống")
    private Integer periodMonth;

    @NotNull(message = "Năm áp dụng không được để trống")
    private Integer periodYear;

    private BigDecimal alertThreshold;
}
