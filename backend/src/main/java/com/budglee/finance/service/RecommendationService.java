package com.budglee.finance.service;

import com.budglee.finance.dto.HabitRecommendationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collections;

/**
 * =========================================================================
 * KHUÔN MẪU SERVICE: BOT GỢI Ý TỐI ƯU CHI TIÊU (SPENDING HABITS BOT)
 * Phụ trách: Nguyễn Tiến Thành (Frontend & Backend Lead)
 * Nhánh làm việc: 'thanh'
 *
 * Yêu cầu nghiệp vụ cần làm:
 * 1. Phân tích lịch sử chi tiêu tháng này so với tháng trước.
 * 2. Phát hiện các Category tăng bất thường (> 15-20%).
 * 3. Đưa ra cảnh báo và khuyến nghị điều chỉnh thói quen chi tiêu.
 * =========================================================================
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    public HabitRecommendationResponse generateSpendingAdvice(Long userId, int year, int month) {
        log.info("[TODO - THÀNH] Cài đặt thuật toán Bot phân tích thói quen chi tiêu cho userId: {}", userId);
        
        // TODO: Nguyễn Tiến Thành cài đặt logic phân tích thói quen tại đây
        return HabitRecommendationResponse.builder()
                .status("ON_TRACK")
                .primaryAdvice("Hệ thống đang sẵn sàng ghi nhận dữ liệu chi tiêu của bạn.")
                .actionItems(Collections.emptyList())
                .categoryWarnings(Collections.emptyList())
                .build();
    }
}
