package com.budglee.finance.service;

import com.budglee.finance.dto.FamilyGroupCreateRequest;
import com.budglee.finance.dto.RoleUpdateRequest;
import com.budglee.finance.dto.UserStatusRequest;
import com.budglee.finance.entity.FamilyGroup;
import com.budglee.finance.entity.Role;
import com.budglee.finance.entity.User;
import com.budglee.finance.repository.FamilyGroupRepository;
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
 * 4. Không hạ cấp SYSTEM_ADMIN đang bật cuối cùng, vì hết người có quyền thì không tài khoản nào
 *    gán lại được vai trò này nữa.
 * 5. Mã nhóm hộ phải tồn tại trong family_groups (V4 ràng buộc khoá ngoại) — nếu không thì MySQL
 *    từ chối ghi và API trả 500 thay vì báo lỗi dữ liệu.
 * 6. Bật/tắt tài khoản (V13) chặn hai trường hợp: đổi sang trạng thái nó đang có, và tự tắt
 *    chính mình — admin cuối cùng còn bật là người ra lệnh, nên bất biến "còn một admin dùng được"
 *    tự được giữ mà không cần đếm thêm.
 * =========================================================================
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserAdminService {

    private final UserRepository userRepository;
    private final FamilyGroupRepository familyGroupRepository;

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
            requireFamilyGroup(familyGroupId);
        } else {
            familyGroupId = null;
        }

        // Đếm theo admin CÒN BẬT: một SYSTEM_ADMIN đã tắt không gán lại vai trò cho ai được, nên
        // hạ cấp nó không làm hệ thống mất người quản trị.
        if (target.getRole() == Role.SYSTEM_ADMIN && newRole != Role.SYSTEM_ADMIN && isAccountEnabled(target)
                && userRepository.countByRoleAndEnabled(Role.SYSTEM_ADMIN, Boolean.TRUE) <= 1) {
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

    /**
     * FamilyService (DUAN-53 của Tú) chỉ cho gửi lời mời khi FAMILY_ADMIN đúng là người tạo nhóm,
     * nên phải đổi cả vai trò lẫn mã nhóm ngay đây — nếu chỉ tạo bảng thì không tài khoản nào
     * vượt được kiểm tra đó và tính năng hộ gia đình không chạy được.
     */
    @Transactional
    public FamilyGroup createFamilyGroup(FamilyGroupCreateRequest request, UserPrincipal actor) {
        String code = request.getId().trim();
        User owner = userRepository.findById(request.getOwnerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));

        if (familyGroupRepository.existsById(code)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mã nhóm hộ đã tồn tại");
        }
        if (owner.getRole() == Role.SYSTEM_ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Quản trị hệ thống không đứng tên một nhóm hộ");
        }
        if (owner.getFamilyGroupId() != null && !owner.getFamilyGroupId().isBlank()
                && !owner.getFamilyGroupId().equals(code)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Tài khoản đang thuộc nhóm hộ khác, phải rời nhóm trước");
        }

        FamilyGroup group = familyGroupRepository.save(FamilyGroup.builder()
                .id(code)
                .name(request.getName().trim())
                .createdBy(owner)
                .build());

        owner.setRole(Role.FAMILY_ADMIN);
        owner.setFamilyGroupId(code);
        userRepository.save(owner);

        log.info("Tạo nhóm hộ {} tên={} chủ hộ={} bởi admin={}", code, group.getName(), owner.getId(), actor.getId());
        return group;
    }

    /**
     * Tắt tài khoản thay vì xoá: giữ lại lịch sử giao dịch, chỉ cắt quyền truy cập. Cờ enabled
     * được đọc lại ở mọi request (JwtAuthenticationFilter) nên token còn hạn cũng mất hiệu lực
     * ngay, không phải chờ hết hạn 24 giờ.
     */
    @Transactional
    public User updateStatus(Long userId, UserStatusRequest request, UserPrincipal actor) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));

        boolean enable = Boolean.TRUE.equals(request.getEnabled());
        if (enable == isAccountEnabled(target)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    enable ? "Tài khoản đang bật rồi" : "Tài khoản đang tắt rồi");
        }
        // Admin tắt nhầm tài khoản của chính mình thì màn hình quản trị đóng lại ngay và không
        // còn ai gọi API để bật lại. Kiểm tra này tự nó đã đảm bảo luôn còn một SYSTEM_ADMIN bật
        // được: người ra lệnh chính là người đó.
        if (!enable && actor.getId().equals(target.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Không thể tắt chính tài khoản của bạn");
        }

        target.setEnabled(enable);
        User saved = userRepository.save(target);
        log.info("{} tài khoản id={} email={} bởi admin={}",
                enable ? "Mở khoá" : "Khoá", saved.getId(), saved.getEmail(), actor.getId());
        return saved;
    }

    private static boolean isAccountEnabled(User user) {
        return user.getEnabled() == null || user.getEnabled();
    }

    private void requireFamilyGroup(String familyGroupId) {
        if (!familyGroupRepository.existsById(familyGroupId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Mã nhóm hộ không tồn tại: " + familyGroupId);
        }
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
