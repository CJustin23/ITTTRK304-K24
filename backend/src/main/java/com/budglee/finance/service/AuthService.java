package com.budglee.finance.service;

import com.budglee.finance.dto.AuthRequest;
import com.budglee.finance.dto.AuthResponse;
import com.budglee.finance.dto.RegisterRequest;
import com.budglee.finance.dto.ForgotPasswordRequest;
import com.budglee.finance.dto.ForgotPasswordResponse;
import com.budglee.finance.dto.ResetPasswordRequest;
import com.budglee.finance.security.PasswordResetService;
import com.budglee.finance.entity.Role;
import com.budglee.finance.entity.User;
import com.budglee.finance.repository.FamilyGroupRepository;
import com.budglee.finance.repository.UserRepository;
import com.budglee.finance.security.JwtTokenProvider;
import com.budglee.finance.security.LoginAttemptService;
import com.budglee.finance.security.TokenBlocklist;
import com.budglee.finance.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
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
 * Đã cài đặt (DUAN-39):
 * 1. Email lưu ở dạng chữ thường; đăng ký lại bằng chữ HOA vẫn bị 409.
 * 2. Mật khẩu chỉ lưu dạng băm BCrypt, không bao giờ trả ra response.
 * 3. Vai trò bị khoá: đơn đăng ký công khai chỉ được INDIVIDUAL_USER hoặc FAMILY_MEMBER,
 *    và FAMILY_MEMBER phải kèm mã nhóm hộ. Nhận FAMILY_ADMIN/SYSTEM_ADMIN thì trả 400,
 *    vì nếu không thì ai cũng tự cấp quyền quản trị cho mình.
 * 4. Đăng nhập đi qua AuthenticationManager (DaoAuthenticationProvider + BCrypt),
 *    sai một trong hai thông tin đều trả cùng một thông báo 401 để không dò được email nào có thật.
 * 5. Thành công cấp JWT HS256 qua JwtTokenProvider; token này đi vừa với JwtAuthenticationFilter.
 * 6. Mã nhóm hộ gửi lên phải có thật trong family_groups, vì V4 đã ràng buộc khoá ngoại.
 * 7. Đăng nhập sai bị đếm theo email và IP (LoginAttemptService) — vượt ngưỡng trả 429,
 *    không cho dò mật khẩu theo từ điển.
 * 8. Đăng xuất thu hồi token qua TokenBlocklist; tài khoản bị quản trị tắt thì cờ enabled
 *    chặn ở cả cửa đăng nhập lẫn cửa token cũ còn hạn.
 * =========================================================================
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    private static final Set<Role> SELF_SERVICE_ROLES = Set.of(Role.INDIVIDUAL_USER, Role.FAMILY_MEMBER);

    private final UserRepository userRepository;
    private final FamilyGroupRepository familyGroupRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final LoginAttemptService loginAttemptService;
    private final TokenBlocklist tokenBlocklist;
    private final PasswordResetService passwordResetService;
    private final EmailService emailService;

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
        // V4 ràng buộc users.family_group_id thành khoá ngoại sang family_groups. Chỉ chặn khi mã
        // này thực sự được ghi xuống (FAMILY_MEMBER); INDIVIDUAL_USER thì mã bị bỏ qua nên không cần kiểm tra.
        if (role == Role.FAMILY_MEMBER && !familyGroupRepository.existsById(familyGroupId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Mã nhóm hộ không tồn tại: " + familyGroupId);
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

    public AuthResponse login(AuthRequest request, String clientIp) {
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        loginAttemptService.rejectIfBlocked(email, clientIp);

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getPassword()));
        } catch (DisabledException exception) {
            // DaoAuthenticationProvider kiểm tra cờ enabled trước khi so mật khẩu, nên đây là
            // tài khoản quản trị vừa tắt — báo rõ để người dùng biết đi tìm admin, không phải dò credential.
            log.warn("Đăng nhập bị từ chối vì tài khoản đã khoá email={}", email);
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Tài khoản đã bị khoá, liên hệ quản trị viên");
        } catch (AuthenticationException exception) {
            loginAttemptService.recordFailure(email, clientIp);
            log.warn("Đăng nhập thất bại với email={} ip={}", email, clientIp);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không đúng");
        }

        loginAttemptService.reset(email, clientIp);
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findByEmail(principal.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không đúng"));

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

    /**
     * Đăng xuất phía JWT: server không có session để xoá, nên việc duy nhất có nghĩa là ghi token
     * hiện tại vào blocklist cho tới khi nó hết hạn. Frontend vẫn phải tự xoá token phía nó, đây
     * là cửa để token bị đánh mất hiệu lực ngay, thay vì chờ hết hạn 24 giờ.
     */
    public void logout(String token) {
        if (token == null || token.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không có token để thu hồi");
        }
        if (!tokenProvider.validateToken(token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token không hợp lệ hoặc đã hết hạn");
        }
        tokenBlocklist.block(token, tokenProvider.getRemainingValidityMs(token));
        log.info("Thu hồi token của email={}", tokenProvider.getEmailFromToken(token));
    }

    public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy tài khoản với địa chỉ email: " + email));

        if (Boolean.FALSE.equals(user.getEnabled())) {
            log.warn("Yêu cầu quên mật khẩu bị từ chối vì tài khoản đã bị khoá email={}", email);
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Tài khoản đã bị khoá, liên hệ quản trị viên");
        }

        String otp = passwordResetService.generateAndSaveCode(email);

        // Gửi email thực sự qua SMTP đến hòm thư người dùng
        emailService.sendPasswordResetOtp(email, otp);

        return ForgotPasswordResponse.builder()
                .email(email)
                .otp(null)
                .message("Mã xác thực 6 chữ số đã được gửi đến hộp thư " + email + ". Vui lòng kiểm tra email của bạn!")
                .expiresInSeconds(PasswordResetService.OTP_VALIDITY.toSeconds())
                .build();
    }

    public void resetPassword(ResetPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy tài khoản với địa chỉ email: " + email));

        if (Boolean.FALSE.equals(user.getEnabled())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Tài khoản đã bị khoá, liên hệ quản trị viên");
        }

        // Kiểm tra và huỷ mã OTP
        passwordResetService.verifyAndInvalidateCode(email, request.getOtp());

        // Cập nhật mật khẩu mới băm BCrypt
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        log.info("Đổi mật khẩu thành công cho email={}", email);
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
