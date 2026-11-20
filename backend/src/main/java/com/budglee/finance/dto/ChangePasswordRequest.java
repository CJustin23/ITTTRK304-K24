package com.budglee.finance.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangePasswordRequest {

    @Schema(description = "Email người dùng (tùy chọn nếu đã đăng nhập)", example = "user@example.com")
    private String email;

    @NotBlank(message = "Vui lòng nhập mật khẩu hiện tại")
    @Schema(description = "Mật khẩu hiện tại của người dùng", example = "password123")
    private String currentPassword;

    @NotBlank(message = "Vui lòng nhập mật khẩu mới")
    @Size(min = 6, message = "Mật khẩu mới phải có tối thiểu 6 ký tự")
    @Schema(description = "Mật khẩu mới", example = "newPassword@2026")
    private String newPassword;
}
