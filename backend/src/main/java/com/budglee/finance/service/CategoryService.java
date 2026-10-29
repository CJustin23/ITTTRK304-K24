package com.budglee.finance.service;

import com.budglee.finance.dto.CategoryRequest;
import com.budglee.finance.entity.Category;
import com.budglee.finance.entity.Role;
import com.budglee.finance.repository.CategoryRepository;
import com.budglee.finance.repository.TransactionRepository;
import com.budglee.finance.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * =========================================================================
 * SERVICE: DANH MỤC THU / CHI (DUAN-49)
 * Phụ trách: Nguyễn Trường An (Backend Lead) — nhánh 'an'
 *
 * Quy tắc:
 * 1. Người dùng chỉ sửa/xoá được danh mục của mình; danh mục của người khác trả 404
 *    (không trả 403 để không cho dò id nào tồn tại).
 * 2. Danh mục hệ thống (user_id = null) chỉ SYSTEM_ADMIN được sửa hoặc xoá — đây là chỗ
 *    phân quyền theo vai trò đầu tiên có thật trong API.
 * 3. Đã có giao dịch gắn vào thì không cho xoá, và không cho đổi loại THU/CHI vì ngân sách
 *    và báo cáo đang khoá theo loại.
 * =========================================================================
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;

    @Transactional
    public Category update(Long categoryId, CategoryRequest request, UserPrincipal actor) {
        Category category = findWritable(categoryId, actor);

        if (request.getType() != null && request.getType() != category.getType()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Không thể đổi loại danh mục sau khi đã tạo");
        }

        category.setName(request.getName().trim());
        category.setIcon(trimToNull(request.getIcon()));
        category.setColorCode(trimToNull(request.getColorCode()));

        Category saved = categoryRepository.save(category);
        log.info("Cập nhật danh mục id={} bởi user={} tên={}", saved.getId(), actor.getId(), saved.getName());
        return saved;
    }

    @Transactional
    public void delete(Long categoryId, UserPrincipal actor) {
        Category category = findWritable(categoryId, actor);

        if (transactionRepository.existsByCategoryId(categoryId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Danh mục đã có giao dịch nên không thể xoá");
        }
        categoryRepository.delete(category);
        log.info("Xoá danh mục id={} bởi user={}", categoryId, actor.getId());
    }

    private Category findWritable(Long categoryId, UserPrincipal actor) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Danh mục không tồn tại"));

        Long ownerId = category.getUser() == null ? null : category.getUser().getId();
        if (ownerId == null) {
            if (!isSystemAdmin(actor)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Danh mục hệ thống chỉ quản trị viên mới được sửa");
            }
            return category;
        }
        if (!ownerId.equals(actor.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Danh mục không tồn tại");
        }
        return category;
    }

    private static boolean isSystemAdmin(UserPrincipal actor) {
        String required = "ROLE_" + Role.SYSTEM_ADMIN.name();
        return actor.getAuthorities().stream().anyMatch(authority -> required.equals(authority.getAuthority()));
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
