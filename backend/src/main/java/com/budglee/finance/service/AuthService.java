package com.budglee.finance.service;

import com.budglee.finance.dto.AuthRequest;
import com.budglee.finance.dto.AuthResponse;
import com.budglee.finance.dto.RegisterRequest;
import com.budglee.finance.entity.Role;
import com.budglee.finance.entity.User;
import com.budglee.finance.repository.UserRepository;
import com.budglee.finance.security.JwtTokenProvider;
import com.budglee.finance.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * =========================================================================
 * SERVICE: XÁC THỰC & PHÂN QUYỀN (AUTH & SECURITY)
 * Phụ trách: Nguyễn Trường An (Backend Lead) — nhánh 'an'
 *
 * Quy tắc đã cài đặt:
 * 1. Email trùng khi đăng ký trả 409; email lưu dạng đã chuẩn hoá chữ thường.
 * 2. Mật khẩu chỉ lưu dưới dạng băm BCrypt (password_hash).
 * 3. Đăng nhập đi qua AuthenticationManager; sai thông tin trả 401, không tiết lộ
 *    email nào tồn tại trong hệ thống.
 * 4. Thành công cấp JWT HS256 qua JwtTokenProvider.
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
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email đã được đăng ký");
        }

        User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole() == null ? Role.INDIVIDUAL_USER : request.getRole())
                .familyGroupId(request.getFamilyGroupId())
                .build();
        User saved = userRepository.save(user);
        log.info("Đã tạo tài khoản id={} email={}", saved.getId(), saved.getEmail());

        AuthRequest autoLogin = new AuthRequest();
        autoLogin.setEmail(email);
        autoLogin.setPassword(request.getPassword());
        return login(autoLogin);
    }

    public AuthResponse login(AuthRequest request) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail().trim(), request.getPassword()));
        } catch (AuthenticationException ex) {
            log.warn("Đăng nhập thất bại với email={}", request.getEmail());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không đúng");
        }

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findByEmail(principal.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tài khoản không còn tồn tại"));

        return AuthResponse.builder()
                .token(tokenProvider.generateToken(authentication))
                .type("Bearer")
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .familyGroupId(user.getFamilyGroupId())
                .build();
    }
}
