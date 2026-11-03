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

import java.util.Locale;
/**
 * =========================================================================
 * SERVICE: XÁC THỰC & PHÂN QUYỀN (AUTH & SECURITY)
 * Phụ trách: Nguyễn Trường An (Backend Lead) — nhánh 'an'
 *
 * Đã cài đặt (DUAN-39):
 * 1. Email lưu ở dạng chữ thường; đăng ký lại bằng chữ HOA vẫn bị 409.
 * 2. Mật khẩu chỉ lưu dạng băm BCrypt, không bao giờ trả ra response.
 * 3. Vai trò bị khoá: đơn đăng ký công khai chỉ được INDIVIDUAL_USER hoặc FAMILY_MEMBER,
 *    và FAMILY_MEMBER phải kèm mã nhóm hộ. Nhận FAMILY_ADMIN/SYSTEM_ADMIN thì trả 400,
 *    vì nếu không thì ai cũng tự cấp quyền quản trị cho mình.
 * 4. Đăng nhập đi qua AuthenticationManager (DaoAuthenticationProvider + BCrypt),
 *    sai một trong hai thông tin đều trả cùng một thông báo 401 để không dò được email nào có thật.
 * 5. Thành công cấp JWT HS256 qua JwtTokenProvider; token này đi vừa với JwtAuthenticationFilter.
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
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);

        Role role = request.getRole() == null
                ? Role.INDIVIDUAL_USER
                : request.getRole();

        // Đăng ký công khai chỉ được tạo tài khoản cá nhân.
        // FAMILY_ADMIN và FAMILY_MEMBER phải được cấp thông qua nghiệp vụ riêng.
        if (role != Role.INDIVIDUAL_USER) {
            log.warn("Đăng ký không hợp lệ với vai trò {} cho email={}", role, email);

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Chỉ được đăng ký tài khoản cá nhân. Muốn tham gia gia đình, hãy nhận lời mời."
            );
        }

        // Không cho phép truyền familyGroupId khi đăng ký công khai.
        if (request.getFamilyGroupId() != null
                && !request.getFamilyGroupId().trim().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Không thể tự tham gia nhóm gia đình khi đăng ký"
            );
        }

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Email đã được đăng ký"
            );
        }

        User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.INDIVIDUAL_USER)
                .familyGroupId(null)
                .build();

        User saved = userRepository.save(user);

        log.info(
                "Đăng ký thành công id={} email={} vai tro={}",
                saved.getId(),
                saved.getEmail(),
                saved.getRole()
        );

        return AuthResponse.builder()
                .id(saved.getId())
                .fullName(saved.getFullName())
                .email(saved.getEmail())
                .role(saved.getRole())
                .familyGroupId(saved.getFamilyGroupId())
                .build();
    }

    public AuthResponse login(AuthRequest request) {
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);

        Authentication authentication;

        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            email,
                            request.getPassword()
                    )
            );
        } catch (AuthenticationException exception) {
            log.warn("Đăng nhập thất bại với email={}", email);

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Email hoặc mật khẩu không đúng"
            );
        }

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        User user = userRepository.findByEmail(principal.getEmail())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Email hoặc mật khẩu không đúng"
                ));

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
