package com.budglee.finance.dto;

import com.budglee.finance.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "Họ và tên không được để trống")
    private String fullName;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    @Pattern(regexp = "^[^@\\s]+@gmail\\.com$", flags = Pattern.Flag.CASE_INSENSITIVE,
            message = "Vui lòng sử dụng địa chỉ Gmail có dạng example@gmail.com")
    private String email;

    /**
     * BCrypt làm chậm việc dò offline, nhưng không cứu được mật khẩu 6 ký tự chỉ có chữ
     * ("password" bị crack trong vài giờ bằng rockyou). Ràng buộc nằm ở cửa ghi nên dữ liệu
     * trong CSDL chắc chắn đủ mạnh; không áp cho AuthRequest vì tài khoản cũ vẫn phải đăng nhập được.
     */
    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 8, max = 100, message = "Mật khẩu phải từ 8 đến 100 ký tự")
    @Pattern(regexp = "^(?=.*[A-Z])(?=.*\\d).+$", message = "Mật khẩu phải có ít nhất một chữ HOA và một chữ số")
    private String password;

    private Role role = Role.INDIVIDUAL_USER;
    private String familyGroupId;
}
