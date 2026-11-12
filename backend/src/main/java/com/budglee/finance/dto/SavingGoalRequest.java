package com.budglee.finance.dto;

import com.budglee.finance.entity.GoalStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavingGoalRequest {
    @NotBlank(message = "Tên mục tiêu tiết kiệm không được để trống")
    private String goalName;

    @NotNull(message = "Số tiền mục tiêu không được để trống")
    @DecimalMin(value = "0.01", message = "Số tiền mục tiêu phải lớn hơn 0")
    private BigDecimal targetAmount;

    private BigDecimal currentAmount;

    // Hỗ trợ cả deadline hoặc targetDate
    private LocalDate deadline;
    private LocalDate targetDate;

    private GoalStatus status;
}

