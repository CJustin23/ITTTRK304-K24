package com.budglee.finance.config;

import com.budglee.finance.entity.FamilyGroup;
import com.budglee.finance.entity.Role;
import com.budglee.finance.entity.User;
import com.budglee.finance.repository.FamilyGroupRepository;
import com.budglee.finance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Profile({"local", "dev", "test"})
@RequiredArgsConstructor
@Slf4j
public class DataLoader implements CommandLineRunner {

    private final UserRepository userRepository;
    private final FamilyGroupRepository familyGroupRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("==> Khởi tạo dữ liệu người dùng mẫu cho môi trường Local / Dev");

        // 1. Tài khoản Chủ hộ demo
        User familyAdmin = userRepository.findByEmail("family@budglee.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .fullName("Trần Thị Hạnh Phúc")
                        .email("family@budglee.com")
                        .passwordHash(passwordEncoder.encode("Budglee@2026"))
                        .role(Role.FAMILY_ADMIN)
                        .familyGroupId("FAM-001")
                        .enabled(true)
                        .build())
        );

        familyGroupRepository.findById("FAM-001").orElseGet(() ->
                familyGroupRepository.save(FamilyGroup.builder()
                        .id("FAM-001")
                        .name("Gia đình Hạnh Phúc")
                        .createdBy(familyAdmin)
                        .build())
        );

        // 2. Tài khoản Thành viên demo
        userRepository.findByEmail("member@budglee.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .fullName("Lê Gia Bảo")
                        .email("member@budglee.com")
                        .passwordHash(passwordEncoder.encode("Budglee@2026"))
                        .role(Role.FAMILY_MEMBER)
                        .familyGroupId("FAM-001")
                        .enabled(true)
                        .build())
        );

        // 3. Tài khoản Demo cá nhân
        userRepository.findByEmail("demo@budglee.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .fullName("Nguyễn Văn Demo")
                        .email("demo@budglee.com")
                        .passwordHash(passwordEncoder.encode("Budglee@2026"))
                        .role(Role.INDIVIDUAL_USER)
                        .enabled(true)
                        .build())
        );

        // 4. Tài khoản Nguyễn Tiến Thành (độc lập, sẵn sàng để nhận lời mời)
        userRepository.findByEmail("thannhk6@gmail.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .fullName("Nguyễn Tiến Thành")
                        .email("thannhk6@gmail.com")
                        .passwordHash(passwordEncoder.encode("Budglee@2026"))
                        .role(Role.INDIVIDUAL_USER)
                        .enabled(true)
                        .build())
        );

        userRepository.findByEmail("thenng@gmail.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .fullName("Nguyễn Tiến Thành")
                        .email("thenng@gmail.com")
                        .passwordHash(passwordEncoder.encode("Budglee@2026"))
                        .role(Role.INDIVIDUAL_USER)
                        .enabled(true)
                        .build())
        );

        log.info("==> Đã khởi tạo xong các tài khoản mẫu trong H2 Database");
    }
}

