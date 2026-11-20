package com.budglee.finance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Đọc ngân sách phải trả về DTO, không trả entity: số đã chi là tổng tính từ lịch sử giao dịch
 * ngay lúc đọc, ghi nó vào entity trong một transaction chỉ-read thì không bao giờ xuống CSDL,
 * còn đọc thẳng cột spent_amount thì lại nhận số cũ.
 *
 * Shape này khớp đúng interface Budget mà frontend đang dùng (categoryId, categoryName,
 * categoryIcon — entity thì trả object category lồng nhau).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetResponse {
    private Long id;
    private Long categoryId;
    private String categoryName;
    private String categoryIcon;
    private BigDecimal amountLimit;
    private BigDecimal spentAmount;
    private Integer periodMonth;
    private Integer periodYear;
    private BigDecimal alertThreshold;
    private String alertLevel;
}
