package com.budglee.finance.dto;

import com.budglee.finance.entity.CategoryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DUAN-49 — chỉ nhận đúng những gì người dùng được sửa.
 * Không dùng thẳng entity Category làm body để tránh người gọi tự gán user_id hoặc created_at.
 */
@Data
public class CategoryRequest {

    @NotBlank(message = "Tên danh mục không được để trống")
    @Size(max = 100, message = "Tên danh mục tối đa 100 ký tự")
    private String name;

    @NotNull(message = "Loại danh mục không được để trống")
    private CategoryType type;

    @Size(max = 50, message = "Biểu tượng tối đa 50 ký tự")
    private String icon;

    @Size(max = 20, message = "Mã màu tối đa 20 ký tự")
    private String colorCode;
}
