package com.budglee.finance.service;

import com.budglee.finance.dto.HabitRecommendationResponse;
import com.budglee.finance.entity.Budget;
import com.budglee.finance.repository.BudgetRepository;
import com.budglee.finance.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

/**
 * =========================================================================
 * PHÂN HỆ: TRỢ LÝ AI GỢI Ý TỐI ƯU CHI TIÊU (SPENDING HABITS RECOMMENDATION BOT)
 * Phụ trách: Nguyễn Tiến Thành (Frontend & Backend Lead)
 * Nhánh phát triển: 'thanh'
 *
 * Tính năng chính:
 * 1. Phân tích chi tiêu thực tế so với hạn mức ngân sách theo từng danh mục.
 * 2. Tự động sinh cảnh báo (CategoryWarning) khi chi tiêu đạt trên 80% hoặc vượt 100% ngân sách.
 * 3. Đưa ra khuyến nghị tài chính thực tế (primaryAdvice, actionItems) dựa trên số liệu giao dịch.
 * =========================================================================
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    private final BudgetRepository budgetRepository;
    private final TransactionRepository transactionRepository;

    @Transactional(readOnly = true)
    public HabitRecommendationResponse generateSpendingAdvice(Long userId, int year, int month) {
        log.info("[THÀNH - AI BOT] Phân tích thói quen chi tiêu thực tế cho userId: {}, kỳ: {}/{}", userId, month, year);

        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);

        // 1. Lấy phân bổ chi tiêu thực tế theo từng danh mục
        List<Object[]> rawCategoryBreakdown = transactionRepository.getCategoryExpenseBreakdown(
                userId, startDateTime, endDateTime);
        Map<String, BigDecimal> actualExpenseMap = new HashMap<>();
        BigDecimal totalSpent = BigDecimal.ZERO;
        for (Object[] row : rawCategoryBreakdown) {
            String catName = row[0] != null ? (String) row[0] : "Khác";
            BigDecimal amount = row[1] != null ? (BigDecimal) row[1] : BigDecimal.ZERO;
            actualExpenseMap.put(catName, amount);
            totalSpent = totalSpent.add(amount);
        }

        // 2. Lấy danh sách ngân sách đã đặt trong tháng
        List<Budget> budgets = budgetRepository.findByUserIdAndPeriodMonthAndPeriodYear(userId, month, year);
        List<HabitRecommendationResponse.CategoryWarning> warnings = new ArrayList<>();

        boolean hasOverspent = false;
        boolean hasHighRisk = false;

        if (budgets != null && !budgets.isEmpty()) {
            for (Budget b : budgets) {
                if (b.getCategory() == null || b.getAmountLimit() == null || b.getAmountLimit().compareTo(BigDecimal.ZERO) <= 0) {
                    continue;
                }
                String catName = b.getCategory().getName();
                BigDecimal limit = b.getAmountLimit();
                BigDecimal actual = actualExpenseMap.getOrDefault(catName, BigDecimal.ZERO);

                if (actual.compareTo(limit) > 0) {
                    hasOverspent = true;
                    double percent = actual.subtract(limit).divide(limit, 4, RoundingMode.HALF_UP).doubleValue() * 100.0;
                    warnings.add(HabitRecommendationResponse.CategoryWarning.builder()
                            .categoryName(catName)
                            .increasePercentage(Math.round(percent * 10.0) / 10.0)
                            .recommendation(String.format("Danh mục '%s' đã vượt ngân sách %.1f%%. Cần dừng các khoản phát sinh không cần thiết.", catName, percent))
                            .build());
                } else if (actual.compareTo(limit.multiply(new BigDecimal("0.80"))) >= 0) {
                    hasHighRisk = true;
                    double ratio = actual.divide(limit, 4, RoundingMode.HALF_UP).doubleValue() * 100.0;
                    warnings.add(HabitRecommendationResponse.CategoryWarning.builder()
                            .categoryName(catName)
                            .increasePercentage(Math.round(ratio * 10.0) / 10.0)
                            .recommendation(String.format("Danh mục '%s' đã tiêu %.1f%% hạn mức. Hãy cân đối để không bị vượt ngân sách.", catName, ratio))
                            .build());
                }
            }
        } else if (totalSpent.compareTo(BigDecimal.ZERO) > 0) {
            // Trường hợp chưa đặt ngân sách chi tiết nhưng đã có chi tiêu
            String topCat = null;
            BigDecimal maxVal = BigDecimal.ZERO;
            for (Map.Entry<String, BigDecimal> entry : actualExpenseMap.entrySet()) {
                if (entry.getValue().compareTo(maxVal) > 0) {
                    maxVal = entry.getValue();
                    topCat = entry.getKey();
                }
            }
            if (topCat != null && maxVal.compareTo(totalSpent.multiply(new BigDecimal("0.40"))) > 0) {
                hasHighRisk = true;
                double pct = maxVal.divide(totalSpent, 4, RoundingMode.HALF_UP).doubleValue() * 100.0;
                warnings.add(HabitRecommendationResponse.CategoryWarning.builder()
                        .categoryName(topCat)
                        .increasePercentage(Math.round(pct * 10.0) / 10.0)
                        .recommendation(String.format("Khoản chi cho '%s' chiếm tới %.1f%% tổng chi tiêu tháng. Hãy tạo ngân sách riêng để kiểm soát.", topCat, pct))
                        .build());
            }
        }

        String status;
        String primaryAdvice;
        List<String> actionItems;

        if (hasOverspent) {
            status = "OVERSPENT";
            primaryAdvice = "Cảnh báo: Bạn đã vượt hạn mức ngân sách ở một số danh mục! Hãy kiểm tra và cân đối lại chi tiêu ngay.";
            actionItems = Arrays.asList(
                    "Tạm dừng phát sinh chi tiêu mới ở các danh mục đã vượt hạn mức",
                    "Điều chuyển ngân sách từ các khoản dự phòng hoặc cắt giảm chi tiêu giải trí",
                    "Rà soát lại các hóa đơn và giao dịch định kỳ để tối ưu chi phí"
            );
        } else if (hasHighRisk) {
            status = "WARNING";
            primaryAdvice = "Lưu ý: Tốc độ chi tiêu đang ở mức cảnh báo (trên 80% ngân sách). Cần kiểm soát chặt các ngày tới.";
            actionItems = Arrays.asList(
                    "Cắt giảm các khoản mua sắm cá nhân không thực sự cấp thiết",
                    "Ưu tiên giữ số dư khả dụng cho các chi phí sinh hoạt cố định",
                    "Theo dõi sát số dư ví trước mỗi lần thanh toán"
            );
        } else {
            status = "ON_TRACK";
            primaryAdvice = "Tình hình tài chính của bạn đang rất tốt! Chi tiêu hoàn toàn nằm trong tầm kiểm soát.";
            actionItems = Arrays.asList(
                    "Tiếp tục duy trì thói quen chi tiêu kỷ luật theo kế hoạch",
                    "Trích một phần số dư dôi dư vào mục tiêu tiết kiệm hoặc quỹ dự phòng khẩn cấp",
                    "Cập nhật thường xuyên các giao dịch hàng ngày để số liệu luôn chính xác"
            );
        }

        return HabitRecommendationResponse.builder()
                .status(status)
                .primaryAdvice(primaryAdvice)
                .actionItems(actionItems)
                .categoryWarnings(warnings)
                .build();
    }
}
