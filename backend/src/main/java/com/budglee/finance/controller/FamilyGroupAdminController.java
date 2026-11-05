package com.budglee.finance.controller;

import com.budglee.finance.dto.ApiResponse;
import com.budglee.finance.dto.FamilyGroupCreateRequest;
import com.budglee.finance.entity.FamilyGroup;
import com.budglee.finance.security.UserPrincipal;
import com.budglee.finance.service.UserAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/family-groups")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SYSTEM_ADMIN')")
@Tag(name = "Administration", description = "Tạo nhóm hộ — chỉ SYSTEM_ADMIN dùng được")
public class FamilyGroupAdminController {

    private final UserAdminService userAdminService;

    @PostMapping
    @Operation(summary = "Tạo nhóm hộ và đặt chủ hộ thành FAMILY_ADMIN")
    public ResponseEntity<ApiResponse<FamilyGroup>> createFamilyGroup(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody FamilyGroupCreateRequest request) {
        FamilyGroup group = userAdminService.createFamilyGroup(request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(group, "Tạo nhóm hộ thành công"));
    }
}
