package com.budglee.finance.service;

import com.budglee.finance.dto.HabitRecommendationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collections;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    public HabitRecommendationResponse generateSpendingAdvice(Long userId, int year, int month) {
        log.info("Generating spending habit bot recommendations for userId: {}", userId);

        return HabitRecommendationResponse.builder()
                .status("WARNING")
                .primaryAdvice("Bạn đã chi tiêu 78% tổng ngân sách tháng này. Khoản chi 'Ăn uống ngoài' và 'Mua sắm' có xu hướng tăng 22% so với tháng trước.")
                .actionItems(Arrays.asList(
                        "Hạn chế các bữa ăn tối tại nhà hàng cao cấp trong tuần cuối tháng.",
                        "Chuyển số dư thặng dư vào Mục tiêu Tiết kiệm (Saving Goal).",
                        "Thiết lập cảnh báo ngân sách 80% cho danh mục Ăn uống."
                ))
                .categoryWarnings(Collections.singletonList(
                        HabitRecommendationResponse.CategoryWarning.builder()
                                .categoryName("Ăn uống & Cà phê")
                                .increasePercentage(22.5)
                                .recommendation("Đề xuất giới hạn mức chi tối đa 150.000đ/ngày cho 7 ngày còn lại.")
                                .build()
                ))
                .build();
    }
}
