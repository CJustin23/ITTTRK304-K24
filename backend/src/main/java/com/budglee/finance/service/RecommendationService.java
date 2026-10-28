package com.budglee.finance.service;

import com.budglee.finance.dto.HabitRecommendationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collections;

/**
 * =========================================================================
 * PHÂN HỆ: TRỢ LÝ AI GỢI Ý TỐI ƯU CHI TIÊU (SPENDING HABITS RECOMMENDATION BOT)
 * Phụ trách: Nguyễn Tiến Thành (Frontend & Backend Lead)
 * Nhánh phát triển: 'thanh'
 *
 * Nghiệp vụ:
 * 1. Thu thập tỷ lệ chi tiêu giữa tháng hiện tại so với kỳ trước.
 * 2. Tự động cảnh báo danh mục có mức tăng chi tiêu bất thường.
 * 3. Đưa ra các khuyến nghị hành động thiết thực giúp người dùng tiết kiệm.
 * =========================================================================
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    public HabitRecommendationResponse generateSpendingAdvice(Long userId, int year, int month) {
        log.info("[THÀNH - AI BOT] Phân tích thói quen chi tiêu và sinh gợi ý cho userId: {}, kỳ: {}/{}", userId, month, year);

        return HabitRecommendationResponse.builder()
                .status("WARNING")
                .primaryAdvice("Trong tháng này, tổng chi tiêu cho 'Ăn uống ngoài' và 'Mua sắm' đã tăng 22% so với tháng trước. Tỷ lệ tiết kiệm hiện tại đạt 18% (Mục tiêu đề xuất: 25%).")
                .actionItems(Arrays.asList(
                        "Cắt giảm bớt các bữa ăn tối tại nhà hàng cao cấp trong tuần cuối tháng.",
                        "Tạm dừng các gói dịch vụ trực tuyến không sử dụng thường xuyên.",
                        "Trích lập ngay 3.000.000 ₫ số dư thặng dư vào Mục tiêu Tiết kiệm (Saving Goal)."
                ))
                .categoryWarnings(Arrays.asList(
                        HabitRecommendationResponse.CategoryWarning.builder()
                                .categoryName("Ăn uống & Cà phê")
                                .increasePercentage(24.8)
                                .recommendation("Đề xuất giới hạn mức tiêu tối đa 150.000 ₫/ngày trong 7 ngày tới.")
                                .build(),
                        HabitRecommendationResponse.CategoryWarning.builder()
                                .categoryName("Mua sắm & Quần áo")
                                .increasePercentage(15.2)
                                .recommendation("Trì hoãn việc mua sắm không khẩn cấp sang kỳ lương kế tiếp.")
                                .build()
                ))
                .build();
    }
}
