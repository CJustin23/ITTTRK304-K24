package com.budglee.finance;

import com.budglee.finance.entity.FamilyGroup;
import com.budglee.finance.entity.Role;
import com.budglee.finance.entity.User;
import com.budglee.finance.repository.FamilyGroupRepository;
import com.budglee.finance.repository.UserRepository;

/**
 * DUAN-40: từ V4, users.family_group_id là khoá ngoại sang family_groups. Test nào dùng mã nhóm
 * qua API đăng ký / gán vai trò phải tạo nhóm trước, giống dữ liệu thật.
 */
final class FamilyGroupTestData {

    /** Chủ hộ chỉ để thoả mãn khoá ngoại created_by, tài khoản này không dùng để đăng nhập. */
    private static final String NOT_A_LOGIN_PASSWORD = "khong-phai-hash-hop-le";

    private FamilyGroupTestData() {
    }

    static FamilyGroup newGroup(FamilyGroupRepository groups, UserRepository users, String code) {
        User owner = users.save(User.builder()
                .fullName("Chủ hộ " + code)
                .email("owner." + code + "@gmail.com")
                .passwordHash(NOT_A_LOGIN_PASSWORD)
                .role(Role.FAMILY_ADMIN)
                .familyGroupId(code)
                .build());

        return groups.save(FamilyGroup.builder()
                .id(code)
                .name("Nhóm kiểm thử " + code)
                .createdBy(owner)
                .build());
    }
}
