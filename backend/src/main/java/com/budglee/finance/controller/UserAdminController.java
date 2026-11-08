package com.budglee.finance.controller;

import com.budglee.finance.dto.ApiResponse;
import com.budglee.finance.dto.RoleUpdateRequest;
import com.budglee.finance.entity.User;
import com.budglee.finance.security.UserPrincipal;
import com.budglee.finance.service.UserAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SYSTEM_ADMIN')")
@Tag(name = "Administration", description = "Gán vai trò và nhóm hộ — chỉ SYSTEM_ADMIN dùng được")
public class UserAdminController {

    private final UserAdminService userAdminService;

    @GetMapping
    @Operation(summary = "Danh sách người dùng kèm vai trò và mã nhóm hộ")
    public ResponseEntity<ApiResponse<List<User>>> listUsers() {
        List<User> users = userAdminService.listUsers();
        return ResponseEntity.ok(ApiResponse.ok(users, "Lấy danh sách người dùng thành công"));
    }

    @PutMapping("/{id}/role")
    @Operation(summary = "Gán lại vai trò cho một người dùng; vai trò hộ gia đình phải kèm mã nhóm hộ")
    public ResponseEntity<ApiResponse<User>> updateRole(@AuthenticationPrincipal UserPrincipal currentUser,
                                                        @PathVariable Long id,
                                                        @Valid @RequestBody RoleUpdateRequest request) {
        User updated = userAdminService.updateRole(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(updated, "Cập nhật vai trò thành công"));
    }
}
