package com.budglee.finance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavingGoalDepositRequest {
    @NotNull(message = "Số tiền nạp không được để trống")
    @DecimalMin(value = "0.01", message = "Số tiền nạp phải lớn hơn 0")
    private BigDecimal amount;

    private Long fromWalletId;
}

