package com.budglee.finance.service;

import com.budglee.finance.dto.AuthRequest;
import com.budglee.finance.dto.AuthResponse;
import com.budglee.finance.dto.RegisterRequest;
import com.budglee.finance.entity.Role;
import com.budglee.finance.entity.User;
import com.budglee.finance.repository.UserRepository;
import com.budglee.finance.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.util.Set;

/**
 * =========================================================================
 * SERVICE: XÁC THỰC & PHÂN QUYỀN (AUTH & SECURITY)
 * Phụ trách: Nguyễn Trường An (Backend Lead) — nhánh 'an'
 *
 * Đã cài đặt (DUAN-39, phần đăng ký):
 * 1. Email lưu ở dạng chữ thường; đăng ký lại bằng chữ HOA vẫn bị 409.
 * 2. Mật khẩu chỉ lưu dạng băm BCrypt, không bao giờ trả ra response.
 * 3. Vai trò bị khoá: đơn đăng ký công khai chỉ được INDIVIDUAL_USER hoặc FAMILY_MEMBER,
 *    và FAMILY_MEMBER phải kèm mã nhóm hộ. Nhận FAMILY_ADMIN/SYSTEM_ADMIN thì trả 400,
 *    vì nếu không thì ai cũng tự cấp quyền quản trị cho mình.
 *
 * Còn lại (DUAN-39, phần đăng nhập): xác thực qua AuthenticationManager và cấp JWT.
 * =========================================================================
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private static final Set<Role> SELF_SERVICE_ROLES = Set.of(Role.INDIVIDUAL_USER, Role.FAMILY_MEMBER);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        Role role = request.getRole() == null ? Role.INDIVIDUAL_USER : request.getRole();

        if (!SELF_SERVICE_ROLES.contains(role)) {
            log.warn("Đơn đăng ký tự nhận vai trò đặc quyền {} cho email={}", role, email);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Không thể tự đăng ký với vai trò này");
        }
        String familyGroupId = trimToNull(request.getFamilyGroupId());
        if (role == Role.FAMILY_MEMBER && familyGroupId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Thành viên hộ gia đình phải kèm mã nhóm hộ");
        }

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email đã được đăng ký");
        }

        User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .familyGroupId(role == Role.FAMILY_MEMBER ? familyGroupId : null)
                .build();
        User saved = userRepository.save(user);
        log.info("Đăng ký thành công id={} email={} vai tro={}", saved.getId(), saved.getEmail(), saved.getRole());

        return AuthResponse.builder()
                .id(saved.getId())
                .fullName(saved.getFullName())
                .email(saved.getEmail())
                .role(saved.getRole())
                .familyGroupId(saved.getFamilyGroupId())
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

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
