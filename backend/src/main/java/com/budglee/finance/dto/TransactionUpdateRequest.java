package com.budglee.finance.dto;

import com.fasterxml.jackson.annotation.JsonSetter;
import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionUpdateRequest {
    private String actionTitle;

    @DecimalMin(value = "0.01", message = "Số tiền phải lớn hơn 0")
    private BigDecimal amount;

    private Long categoryId;
    private LocalDateTime transactionDate;
    private String note;

    @JsonSetter("transactionDate")
    public void setTransactionDate(Object raw) {
        if (raw == null) {
            this.transactionDate = null;
            return;
        }
        if (raw instanceof LocalDateTime ldt) {
            this.transactionDate = ldt;
            return;
        }
        String str = raw.toString().trim();
        if (str.isBlank()) {
            this.transactionDate = null;
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

