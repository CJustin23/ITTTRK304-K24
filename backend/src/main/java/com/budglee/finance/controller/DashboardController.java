package com.budglee.finance.controller;

import com.budglee.finance.dto.ApiResponse;
import com.budglee.finance.dto.DashboardSummaryResponse;
import com.budglee.finance.dto.HabitRecommendationResponse;
import com.budglee.finance.security.UserPrincipal;
import com.budglee.finance.service.DashboardService;
import com.budglee.finance.service.RecommendationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard & Insights", description = "Thống kê tổng quan & Gợi ý thói quen thông minh")
public class DashboardController {

    private final DashboardService dashboardService;
    private final RecommendationService recommendationService;

    @GetMapping("/summary")
    @Operation(summary = "Lấy dữ liệu tổng quan Dashboard (Tổng số dư, Thu/Chi tháng, Tỷ lệ ngân sách)")
    public ResponseEntity<ApiResponse<DashboardSummaryResponse>> getSummary(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        LocalDate now = LocalDate.now();
        int y = (year != null) ? year : now.getYear();
        int m = (month != null) ? month : now.getMonthValue();

        DashboardSummaryResponse response = dashboardService.getDashboardSummary(currentUser.getId(), y, m);
        return ResponseEntity.ok(ApiResponse.ok(response, "Lấy dữ liệu Dashboard thành công"));
    }

    @GetMapping("/recommendations")
    @Operation(summary = "Kích hoạt Bot phân tích & Đưa ra gợi ý tối ưu chi tiêu")
    public ResponseEntity<ApiResponse<HabitRecommendationResponse>> getBotRecommendations(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        LocalDate now = LocalDate.now();
        int y = (year != null) ? year : now.getYear();
        int m = (month != null) ? month : now.getMonthValue();

        HabitRecommendationResponse response = recommendationService.generateSpendingAdvice(currentUser.getId(), y, m);
        return ResponseEntity.ok(ApiResponse.ok(response, "Kích hoạt phân tích thói quen thành công"));
    }
}
