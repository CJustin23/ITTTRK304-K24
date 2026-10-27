package com.budglee.finance.controller;

import com.budglee.finance.dto.ApiResponse;
import com.budglee.finance.dto.BudgetRequest;
import com.budglee.finance.entity.Budget;
import com.budglee.finance.security.UserPrincipal;
import com.budglee.finance.service.BudgetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/budgets")
@RequiredArgsConstructor
@Tag(name = "Budgets", description = "Quản lý Ngân sách & Hạn mức chi tiêu")
public class BudgetController {

    private final BudgetService budgetService;

    @PostMapping
    @Operation(summary = "Thiết lập ngân sách mới cho tháng hoặc danh mục")
    public ResponseEntity<ApiResponse<Budget>> setBudget(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody BudgetRequest request) {
        Budget budget = budgetService.createOrUpdateBudget(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.ok(budget, "Thiết lập ngân sách thành công"));
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách ngân sách theo tháng và năm")
    public ResponseEntity<ApiResponse<List<Budget>>> getBudgets(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam int month,
            @RequestParam int year) {
        List<Budget> budgets = budgetService.getUserBudgets(currentUser.getId(), month, year);
        return ResponseEntity.ok(ApiResponse.ok(budgets, "Lấy danh sách ngân sách thành công"));
    }
}
