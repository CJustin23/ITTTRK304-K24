package com.budglee.finance.config;

import com.budglee.finance.entity.Role;
import com.budglee.finance.entity.User;
import com.budglee.finance.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

/**
 * DUAN-40: /api/v1/admin/users chỉ SYSTEM_ADMIN gọi được, mà đăng ký công khai thì cố ý khoá nhận
 * vai trò đặc quyền (DUAN-39) — không có cửa này thì DB demo chẳng bao giờ có ai đủ quyền gọi API.
 *
 * Không có email/mật khẩu mặc định trong repo: chỉ chạy khi người khởi động truyền
 * --app.security.system-admin.email và --app.security.system-admin.password.
 */
@Component
@Slf4j
public class SystemAdminBootstrap implements ApplicationRunner {

    private static final int MIN_PASSWORD_LENGTH = 6;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String password;

    public SystemAdminBootstrap(UserRepository userRepository,
                                PasswordEncoder passwordEncoder,
                                @Value("${app.security.system-admin.email:}") String email,
                                @Value("${app.security.system-admin.password:}") String password) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.email = email;
        this.password = password;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        if (normalizedEmail.isEmpty() || password == null || password.isBlank()) {
            return;
        }
        if (password.length() < MIN_PASSWORD_LENGTH) {
            log.warn("Bỏ qua khởi tạo quản trị hệ thống: mật khẩu phải từ {} ký tự", MIN_PASSWORD_LENGTH);
            return;
        }

        User admin = userRepository.findByEmail(normalizedEmail).orElse(null);
        if (admin == null) {
            userRepository.save(User.builder()
                    .fullName("Quản trị hệ thống Budglee")
                    .email(normalizedEmail)
                    .passwordHash(passwordEncoder.encode(password))
                    .role(Role.SYSTEM_ADMIN)
                    .build());
            log.info("Đã khởi tạo tài khoản quản trị hệ thống {}", normalizedEmail);
            return;
        }
        boolean changed = false;
        if (admin.getRole() != Role.SYSTEM_ADMIN) {
            admin.setRole(Role.SYSTEM_ADMIN);
            admin.setFamilyGroupId(null);
            changed = true;
        }
        if (admin.getPasswordHash() == null || !passwordEncoder.matches(password, admin.getPasswordHash())) {
            admin.setPasswordHash(passwordEncoder.encode(password));
            changed = true;
        }
        if (changed) {
            userRepository.save(admin);
            log.info("Đã đồng bộ tài khoản SYSTEM_ADMIN {} theo cấu hình triển khai", normalizedEmail);
        }
    }
}
