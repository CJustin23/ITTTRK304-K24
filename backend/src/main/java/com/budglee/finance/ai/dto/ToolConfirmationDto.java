package com.budglee.finance.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

/**
 * DTO chứa thông tin giao dịch tài chính cần người dùng xác nhận (Human-in-the-loop)
 * trước khi hệ thống thực thi cập nhật số dư ví và lưu vào database.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ToolConfirmationDto {
    private String confirmationId;
    private String toolName;
    private String title;
    private String description;
    private String actionType; // "INCOME" hoặc "EXPENSE"
    private BigDecimal amount;
    private String walletName;
    private String categoryName;
    private String note;
    private Map<String, Object> parameters;
}
