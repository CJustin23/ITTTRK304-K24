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
                        .familyGroupId(null)
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

        if (familyAdmin.getFamilyGroupId() == null) {
            familyAdmin.setFamilyGroupId("FAM-001");
            userRepository.save(familyAdmin);
        }

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

        // 5. Khởi tạo 4 tài khoản hệ thống theo yêu cầu: mật khẩu 123456
        // 5.1. Tài khoản cá nhân thanhcanhan@gmail.com
        userRepository.findByEmail("thanhcanhan@gmail.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .fullName("Nguyễn Tiến Thành")
                        .email("thanhcanhan@gmail.com")
                        .passwordHash(passwordEncoder.encode("123456"))
                        .role(Role.INDIVIDUAL_USER)
                        .enabled(true)
                        .build())
        );

        // 5.2. Nhóm gia đình FAM-HANHPHUC
        User thanhBa = userRepository.findByEmail("thanhba@gmail.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .fullName("Nguyễn Tiến Ba (Ba)")
                        .email("thanhba@gmail.com")
                        .passwordHash(passwordEncoder.encode("123456"))
                        .role(Role.FAMILY_ADMIN)
                        .familyGroupId(null)
                        .enabled(true)
                        .build())
        );

        familyGroupRepository.findById("FAM-HANHPHUC").orElseGet(() ->
                familyGroupRepository.save(FamilyGroup.builder()
                        .id("FAM-HANHPHUC")
                        .name("Gia đình Hạnh Phúc")
                        .createdBy(thanhBa)
                        .build())
        );

        if (thanhBa.getFamilyGroupId() == null) {
            thanhBa.setFamilyGroupId("FAM-HANHPHUC");
            userRepository.save(thanhBa);
        }

        // 5.3. Tài khoản Mẹ
        userRepository.findByEmail("thanhme@gmail.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .fullName("Trần Thị Mẹ (Mẹ)")
                        .email("thanhme@gmail.com")
                        .passwordHash(passwordEncoder.encode("123456"))
                        .role(Role.FAMILY_ADMIN)
                        .familyGroupId("FAM-HANHPHUC")
                        .enabled(true)
                        .build())
        );

        // 5.4. Tài khoản Con
        userRepository.findByEmail("thanhcon@gmail.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .fullName("Nguyễn Tiến Con (Con)")
                        .email("thanhcon@gmail.com")
                        .passwordHash(passwordEncoder.encode("123456"))
                        .role(Role.FAMILY_MEMBER)
                        .familyGroupId("FAM-HANHPHUC")
                        .enabled(true)
                        .build())
        );

        log.info("==> Đã khởi tạo xong các tài khoản mẫu trong H2 Database");
    }
}

