package com.budglee.finance.dto;

import com.budglee.finance.entity.TransactionType;
import com.fasterxml.jackson.annotation.JsonSetter;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

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

    /** Chỉ dùng cho TRANSFER: ví nhận tiền. */
    private Long toWalletId;

    private LocalDateTime transactionDate;
    private String note;

    @JsonSetter("transactionDate")
    public void setTransactionDate(Object raw) {
        if (raw == null) {
            this.transactionDate = LocalDateTime.now();
            return;
        }
        if (raw instanceof LocalDateTime ldt) {
            this.transactionDate = ldt;
            return;
        }
        String str = raw.toString().trim();
        if (str.isBlank()) {
            this.transactionDate = LocalDateTime.now();
            return;
        }
        try {
            if (str.endsWith("Z")) {
                this.transactionDate = Instant.parse(str)
                        .atZone(ZoneId.of("Asia/Ho_Chi_Minh"))
                        .toLocalDateTime();
            } else if (str.contains("T")) {
                String sub = str.length() > 19 ? str.substring(0, 19) : str;
                this.transactionDate = LocalDateTime.parse(sub);
            } else if (str.contains(" ") && str.length() >= 19) {
                this.transactionDate = LocalDateTime.parse(str.substring(0, 19).replace(" ", "T"));
            } else {
                this.transactionDate = LocalDateTime.now();
            }
        } catch (Exception e) {
            this.transactionDate = LocalDateTime.now();
        }
    }
}
