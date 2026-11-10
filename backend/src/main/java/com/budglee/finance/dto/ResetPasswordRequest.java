package com.budglee.finance.dto;

import jakarta.validation.constraints.Email;
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
public class ResetPasswordRequest {

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;

    @NotBlank(message = "Mã xác thực không được để trống")
    @Size(min = 6, max = 6, message = "Mã xác thực phải gồm đúng 6 chữ số")
    @jakarta.validation.constraints.Pattern(regexp = "^\\d{6}$", message = "Mã xác thực phải gồm đúng 6 chữ số")
    private String otp;

    @NotBlank(message = "Mật khẩu mới không được để trống")
    @Size(min = 8, max = 100, message = "Mật khẩu phải từ 8 đến 100 ký tự")
    @jakarta.validation.constraints.Pattern(regexp = "^(?=.*[A-Z])(?=.*\\d).+$", message = "Mật khẩu phải có ít nhất một chữ HOA và một chữ số")
    private String newPassword;
}

