package com.budglee.finance.service;

import com.budglee.finance.dto.RoleUpdateRequest;
import com.budglee.finance.entity.Role;
import com.budglee.finance.entity.User;
import com.budglee.finance.repository.UserRepository;
import com.budglee.finance.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * =========================================================================
 * SERVICE: QUẢN TRỊ VAI TRÒ NGƯỜI DÙNG (RBAC)
 * Phụ trách: Nguyễn Trường An (Backend Lead) — nhánh 'an'
 *
 * Quy tắc:
 * 1. Chỉ SYSTEM_ADMIN mới gọi được; đăng ký công khai đã cố ý khoá nhận vai trò đặc quyền
 *    (DUAN-39) nên nếu không có cửa này thì FAMILY_ADMIN và SYSTEM_ADMIN mãi mãi không ai có.
 * 2. Hai vai trò hộ gia đình phải kèm mã nhóm hộ, giống ràng buộc ở đăng ký; vai trò trống
 *    nhóm hộ thì mọi truy vấn scoped-family đều trả rỗng.
 * 3. INDIVIDUAL_USER và SYSTEM_ADMIN bị xoá mã nhóm hộ: cá nhân không được nhìn thấy dữ liệu
 *    chung, còn quản trị nền tảng quản lý toàn hệ thống chứ không thuộc một hộ.
 * 4. Không hạ cấp SYSTEM_ADMIN cuối cùng, vì hết người có quyền thì không tài khoản nào gán lại
 *    được vai trò này nữa.
 * =========================================================================
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserAdminService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<User> listUsers() {
        return userRepository.findAll(Sort.by(Sort.Direction.ASC, "id"));
    }

    @Transactional
    public User updateRole(Long userId, RoleUpdateRequest request, UserPrincipal actor) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));

        Role newRole = request.getRole();
        String familyGroupId = trimToNull(request.getFamilyGroupId());

        if (newRole == Role.FAMILY_ADMIN || newRole == Role.FAMILY_MEMBER) {
            if (familyGroupId == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Vai trò thuộc hộ gia đình phải kèm mã nhóm hộ");
            }
        } else {
            familyGroupId = null;
        }

        if (target.getRole() == Role.SYSTEM_ADMIN && newRole != Role.SYSTEM_ADMIN
                && userRepository.countByRole(Role.SYSTEM_ADMIN) <= 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Không thể hạ cấp quản trị viên hệ thống cuối cùng");
        }

        Role oldRole = target.getRole();
        target.setRole(newRole);
        target.setFamilyGroupId(familyGroupId);
        User saved = userRepository.save(target);
        log.info("Đổi vai trò user={} email={} từ {} sang {} nhóm hộ={} bởi admin={}",
                saved.getId(), saved.getEmail(), oldRole, newRole, familyGroupId, actor.getId());
        return saved;
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
