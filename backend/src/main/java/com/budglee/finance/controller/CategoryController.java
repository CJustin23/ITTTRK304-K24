package com.budglee.finance.controller;

import com.budglee.finance.dto.ApiResponse;
import com.budglee.finance.dto.CategoryRequest;
import com.budglee.finance.entity.Category;
import com.budglee.finance.security.UserPrincipal;
import com.budglee.finance.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
@Tag(name = "Categories", description = "Quản lý Danh mục Thu / Chi")
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    @Operation(summary = "Lấy danh sách các danh mục khả dụng (Mặc định + Riêng của user)")
    public ResponseEntity<ApiResponse<List<Category>>> getCategories(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<Category> categories = categoryService.listAvailable(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok(categories, "Lấy danh mục thành công"));
    }

    @PostMapping
    @Operation(summary = "Tạo danh mục tùy chỉnh mới")
    public ResponseEntity<ApiResponse<Category>> createCategory(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody CategoryRequest request) {
        Category saved = categoryService.create(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.ok(saved, "Tạo danh mục thành công"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật danh mục của mình; danh mục hệ thống chỉ dành cho quản trị viên")
    public ResponseEntity<ApiResponse<Category>> updateCategory(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request) {
        Category updated = categoryService.update(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(updated, "Cập nhật danh mục thành công"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xoá danh mục của mình; không xoá được danh mục đã có giao dịch")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id) {
        categoryService.delete(id, currentUser);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Xoá danh mục thành công")
                .build());
    }
}
