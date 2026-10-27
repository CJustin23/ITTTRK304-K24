package com.budglee.finance.controller;

import com.budglee.finance.dto.ApiResponse;
import com.budglee.finance.entity.Category;
import com.budglee.finance.repository.CategoryRepository;
import com.budglee.finance.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
@Tag(name = "Categories", description = "Quản lý Danh mục Thu / Chi")
public class CategoryController {

    private final CategoryRepository categoryRepository;

    @GetMapping
    @Operation(summary = "Lấy danh sách các danh mục khả dụng (Mặc định + Riêng của user)")
    public ResponseEntity<ApiResponse<List<Category>>> getCategories(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<Category> categories = categoryRepository.findAllAvailableForUser(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok(categories, "Lấy danh mục thành công"));
    }

    @PostMapping
    @Operation(summary = "Tạo danh mục tùy chỉnh mới")
    public ResponseEntity<ApiResponse<Category>> createCategory(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody Category category) {
        com.budglee.finance.entity.User user = new com.budglee.finance.entity.User();
        user.setId(currentUser.getId());
        category.setUser(user);
        Category saved = categoryRepository.save(category);
        return ResponseEntity.ok(ApiResponse.ok(saved, "Tạo danh mục thành công"));
    }
}
