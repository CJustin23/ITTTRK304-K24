package com.budglee.finance.controller;

import com.budglee.finance.dto.ApiResponse;
import com.budglee.finance.dto.AuthRequest;
import com.budglee.finance.dto.AuthResponse;
import com.budglee.finance.dto.RegisterRequest;
import com.budglee.finance.dto.ForgotPasswordRequest;
import com.budglee.finance.dto.ForgotPasswordResponse;
import com.budglee.finance.dto.ResetPasswordRequest;
import com.budglee.finance.dto.VerifyOtpRequest;
import com.budglee.finance.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Xác thực & Đăng nhập / Đăng ký người dùng")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản người dùng mới")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Đăng ký tài khoản thành công"));
    }

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập bằng Email và Password")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody AuthRequest request,
                                                           HttpServletRequest servletRequest) {
        AuthResponse response = authService.login(request, clientIpOf(servletRequest));
        return ResponseEntity.ok(ApiResponse.ok(response, "Đăng nhập thành công"));
    }

    @PostMapping("/logout")
    @Operation(summary = "Thu hồi token đang dùng; token đó chết ngay thay vì chờ hết hạn")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest servletRequest) {
        authService.logout(bearerTokenOf(servletRequest));
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Đăng xuất thành công")
                .build());
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Yêu cầu mã xác thực 6 chữ số để đổi mật khẩu qua Email")
    public ResponseEntity<ApiResponse<ForgotPasswordResponse>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        ForgotPasswordResponse response = authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.ok(response, response.getMessage()));
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Kiểm tra mã xác thực 6 chữ số trước khi cho phép đổi mật khẩu mới")
    public ResponseEntity<ApiResponse<Void>> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request) {
        authService.verifyOtp(request);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Mã xác thực hợp lệ. Bạn có thể tiến hành đổi mật khẩu mới")
                .build());
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Xác nhận mã 6 ký tự và đổi mật khẩu mới")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Đổi mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới")
                .build());
    }

    private static String bearerTokenOf(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    /**
     * Backend chạy sau nginx (deploy/docker-compose.vps.yml) nên getRemoteAddr() luôn là IP của
     * container nginx, vô dụng để chặn brute-force. nginx dùng $proxy_add_x_forwarded_for tức là
     * NỐI thêm IP thật của peer vào cuối chuỗi, còn client gửi header giả thì chỉ đứng ở đầu —
     * vì vậy phải lấy hop cuối cùng, không lấy hop đầu tiên.
     */
    private static String clientIpOf(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(forwarded)) {
            String[] hops = forwarded.split(",");
            return hops[hops.length - 1].trim();
        }
        return request.getRemoteAddr();
    }
}
