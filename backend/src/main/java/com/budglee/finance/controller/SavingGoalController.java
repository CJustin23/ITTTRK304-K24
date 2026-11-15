package com.budglee.finance.controller;

import com.budglee.finance.dto.ApiResponse;
import com.budglee.finance.dto.SavingGoalDepositRequest;
import com.budglee.finance.dto.SavingGoalRequest;
import com.budglee.finance.dto.SavingGoalResponse;
import com.budglee.finance.dto.SavingGoalUpdateRequest;
import com.budglee.finance.security.UserPrincipal;
import com.budglee.finance.service.SavingGoalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/saving-goals")
@RequiredArgsConstructor
@Tag(name = "Saving Goals", description = "Quản lý Mục tiêu tiết kiệm cá nhân")
public class SavingGoalController {

    private final SavingGoalService savingGoalService;

    @PostMapping
    @Operation(summary = "Tạo mục tiêu tiết kiệm mới")
    public ResponseEntity<ApiResponse<SavingGoalResponse>> createGoal(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody SavingGoalRequest request) {
        SavingGoalResponse response = savingGoalService.createGoal(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Tạo mục tiêu tiết kiệm thành công"));
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả mục tiêu tiết kiệm của người dùng")
    public ResponseEntity<ApiResponse<List<SavingGoalResponse>>> getGoals(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<SavingGoalResponse> list = savingGoalService.getUserGoals(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok(list, "Lấy danh sách mục tiêu tiết kiệm thành công"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết một mục tiêu tiết kiệm")
    public ResponseEntity<ApiResponse<SavingGoalResponse>> getGoalById(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id) {
        SavingGoalResponse goal = savingGoalService.getGoalById(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.ok(goal, "Lấy chi tiết mục tiêu thành công"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật mục tiêu tiết kiệm hoặc tiến độ nạp tiền")
    public ResponseEntity<ApiResponse<SavingGoalResponse>> updateGoal(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id,
            @Valid @RequestBody SavingGoalUpdateRequest request) {
        SavingGoalResponse response = savingGoalService.updateGoal(currentUser.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Cập nhật mục tiêu tiết kiệm thành công"));
    }

    @PostMapping("/{id}/deposit")
    @Operation(summary = "Nạp tiền vào mục tiêu tiết kiệm")
    public ResponseEntity<ApiResponse<SavingGoalResponse>> depositToGoal(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id,
            @Valid @RequestBody SavingGoalDepositRequest request) {
        SavingGoalResponse response = savingGoalService.depositToGoal(currentUser.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Nạp tiền vào mục tiêu tiết kiệm thành công"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa mục tiêu tiết kiệm")
    public ResponseEntity<ApiResponse<Void>> deleteGoal(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id) {
        savingGoalService.deleteGoal(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Xóa mục tiêu tiết kiệm thành công"));
    }
}

