package com.budglee.finance.service;

import com.budglee.finance.dto.AuthRequest;
import com.budglee.finance.dto.AuthResponse;
import com.budglee.finance.dto.RegisterRequest;
import com.budglee.finance.repository.UserRepository;
import com.budglee.finance.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * =========================================================================
 * KHUÔN MẪU SERVICE: XÁC THỰC & PHÂN QUYỀN (AUTH & SECURITY)
 * Phụ trách: Nguyễn Trường An (Backend Lead)
 * Nhánh làm việc: 'an'
 *
 * Yêu cầu nghiệp vụ cần làm:
 * 1. Kiểm tra email đã tồn tại hay chưa khi đăng ký.
 * 2. Mã hóa mật khẩu với PasswordEncoder (BCrypt).
 * 3. Tạo tài khoản User và phân quyền theo Role.
 * 4. Xác thực và sinh JWT Token qua JwtTokenProvider.
 * =========================================================================
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    public AuthResponse register(RegisterRequest request) {
        log.info("[TODO - AN] Cài đặt chức năng đăng ký tài khoản cho email: {}", request.getEmail());
        // TODO: Nguyễn Trường An cài đặt logic đăng ký tại đây
        return AuthResponse.builder()
                .token("mock-token")
                .fullName(request.getFullName())
                .email(request.getEmail())
                .role(request.getRole())
                .build();
    }

    public AuthResponse login(AuthRequest request) {
        log.info("[TODO - AN] Cài đặt chức năng đăng nhập JWT cho email: {}", request.getEmail());
        // TODO: Nguyễn Trường An cài đặt logic đăng nhập tại đây
        return AuthResponse.builder()
                .token("mock-token")
                .email(request.getEmail())
                .build();
    }
}
