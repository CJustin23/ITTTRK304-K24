package com.budglee.finance.dto;

import com.budglee.finance.entity.TransactionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class TransactionRequest {
    @NotNull(message = "Ví không được để trống")
    private Long walletId;

    private Long categoryId;

    @NotBlank(message = "Tiêu đề giao dịch không được để trống")
    private String actionTitle;

    @NotNull(message = "Số tiền không được để trống")
    @DecimalMin(value = "0.01", message = "Số tiền phải lớn hơn 0")
    private BigDecimal amount;

    @NotNull(message = "Loại giao dịch không được để trống")
    private TransactionType transactionType;

    private LocalDateTime transactionDate;
    private String note;
}
