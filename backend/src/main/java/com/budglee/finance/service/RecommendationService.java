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
 * Trạng thái: Đang phát triển (Under Development)
 * =========================================================================
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    public HabitRecommendationResponse generateSpendingAdvice(Long userId, int year, int month) {
        log.info("[THÀNH - AI BOT] Phân tích thói quen chi tiêu (Trạng thái: Đang phát triển) cho userId: {}, kỳ: {}/{}", userId, month, year);

        return HabitRecommendationResponse.builder()
                .status("UNDER_DEVELOPMENT")
                .primaryAdvice("Tính năng Trợ lý AI Cố vấn Tài chính đang được hoàn thiện và tích hợp mô hình phân tích dữ liệu chuyên sâu.")
                .actionItems(Arrays.asList(
                        "Chatbot hỏi đáp tình hình thu chi và số dư ví thời gian thực (Đang phát triển).",
                        "Tự động phát hiện bất thường và cảnh báo nguy cơ vượt hạn mức ngân sách.",
                        "Dự kiến chính thức ra mắt trong bản cập nhật kế tiếp của Budglee Platform."
                ))
                .categoryWarnings(Collections.emptyList())
                .build();
    }
}
