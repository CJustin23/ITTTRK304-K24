package com.budglee.finance.service;

import com.budglee.finance.dto.FinancialHealthResponse;
import com.budglee.finance.entity.Budget;
import com.budglee.finance.entity.GoalStatus;
import com.budglee.finance.entity.SavingGoal;
import com.budglee.finance.entity.TransactionType;
import com.budglee.finance.repository.BudgetRepository;
import com.budglee.finance.repository.SavingGoalRepository;
import com.budglee.finance.repository.TransactionRepository;
import com.budglee.finance.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * =========================================================================
 * PHÂN HỆ: ĐÁNH GIÁ ĐIỂM SỨC KHỎE TÀI CHÍNH CÁ NHÂN (FINANCIAL HEALTH SCORE)
 * Thang điểm: 0 - 100
 * Phụ trách: Bàng Trọng Tú (Database & Data Lead) - Sprint 4
 *
 * 4 Trụ cột đánh giá:
 * 1. Tỷ lệ tiết kiệm (Savings Rate) - Tối đa 30 điểm
 * 2. Kỷ luật ngân sách (Budget Discipline) - Tối đa 30 điểm
 * 3. Đệm dự phòng an toàn (Emergency Fund Cushion) - Tối đa 25 điểm
 * 4. Mục tiêu tích lũy (Saving Goals Progress) - Tối đa 15 điểm
 * =========================================================================
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FinancialHealthService {

    private final TransactionRepository transactionRepository;
    private final WalletRepository walletRepository;
    private final BudgetRepository budgetRepository;
    private final SavingGoalRepository savingGoalRepository;

    @Transactional(readOnly = true)
    @Cacheable(value = "financialHealth", key = "#userId + '_' + #year + '_' + #month", unless = "#result == null")
    public FinancialHealthResponse calculateFinancialHealth(Long userId, int year, int month) {
        log.info("[TÚ - FINANCIAL HEALTH] Tính toán điểm sức khỏe tài chính cho userId: {}, kỳ: {}/{}", userId, month, year);

        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);

        // 1. Dữ liệu thu nhập & chi tiêu
        BigDecimal monthlyIncome = transactionRepository.getTotalAmountByTypeAndPeriod(
                userId, TransactionType.INCOME, startDateTime, endDateTime);
        if (monthlyIncome == null) {
            monthlyIncome = BigDecimal.ZERO;
        }

        BigDecimal monthlySpending = transactionRepository.getTotalAmountByTypeAndPeriod(
                userId, TransactionType.EXPENSE, startDateTime, endDateTime);
        if (monthlySpending == null) {
            monthlySpending = BigDecimal.ZERO;
        }

        // 2. Dữ liệu tổng số dư ví
        BigDecimal totalBalance = walletRepository.getTotalBalanceByUserId(userId);
        if (totalBalance == null) {
            totalBalance = BigDecimal.ZERO;
        }

        // 3. Dữ liệu ngân sách trong tháng
        List<Budget> userBudgets = budgetRepository.findByUserIdAndPeriodMonthAndPeriodYear(userId, month, year);
        BigDecimal totalBudgetLimit = BigDecimal.ZERO;
        if (userBudgets != null) {
            for (Budget b : userBudgets) {
                if (b.getAmountLimit() != null) {
                    totalBudgetLimit = totalBudgetLimit.add(b.getAmountLimit());
                }
            }
        }

        // 4. Dữ liệu mục tiêu tích lũy
        List<SavingGoal> userGoals = savingGoalRepository.findByUserId(userId);

        // --- TÍNH ĐIỂM TỪNG TRỤ CỘT ---
        List<String> adviceList = new ArrayList<>();

        // Trụ cột 1: Tỷ lệ tiết kiệm (Tối đa 30đ)
        int savingsScore = calculateSavingsScore(monthlyIncome, monthlySpending, adviceList);
        Double savingsRatePct = null;
        if (monthlyIncome.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal savedAmount = monthlyIncome.subtract(monthlySpending);
            savingsRatePct = savedAmount.divide(monthlyIncome, 4, RoundingMode.HALF_UP).doubleValue() * 100;
        }

        // Trụ cột 2: Kỷ luật ngân sách (Tối đa 30đ)
        int budgetScore = calculateBudgetScore(totalBudgetLimit, monthlySpending, monthlyIncome, adviceList);
        Double budgetUsedPct = null;
        if (totalBudgetLimit.compareTo(BigDecimal.ZERO) > 0) {
            budgetUsedPct = monthlySpending.divide(totalBudgetLimit, 4, RoundingMode.HALF_UP).doubleValue() * 100;
        }

        // Trụ cột 3: Đệm dự phòng an toàn (Tối đa 25đ)
        int emergencyScore = calculateEmergencyFundScore(totalBalance, monthlySpending, adviceList);
        Double emergencyMonths = null;
        if (monthlySpending.compareTo(BigDecimal.ZERO) > 0) {
            emergencyMonths = totalBalance.divide(monthlySpending, 2, RoundingMode.HALF_UP).doubleValue();
        }

        // Trụ cột 4: Mục tiêu tiết kiệm (Tối đa 15đ)
        int goalScore = calculateGoalScore(userGoals, adviceList);
        int activeGoalsCount = 0;
        double avgGoalProgress = 0.0;
        if (userGoals != null && !userGoals.isEmpty()) {
            double totalProgress = 0.0;
            for (SavingGoal g : userGoals) {
                if (g.getStatus() != GoalStatus.CANCELLED) {
                    activeGoalsCount++;
                    if (g.getTargetAmount() != null && g.getTargetAmount().compareTo(BigDecimal.ZERO) > 0) {
                        BigDecimal cur = g.getCurrentAmount() != null ? g.getCurrentAmount() : BigDecimal.ZERO;
                        double p = cur.divide(g.getTargetAmount(), 4, RoundingMode.HALF_UP).doubleValue() * 100;
                        totalProgress += Math.min(p, 100.0);
                    }
                }
            }
            if (activeGoalsCount > 0) {
                avgGoalProgress = Math.round((totalProgress / activeGoalsCount) * 10.0) / 10.0;
            }
        }

        int totalScore = savingsScore + budgetScore + emergencyScore + goalScore;
        totalScore = Math.max(0, Math.min(100, totalScore));

        // Phân loại hạng & tóm tắt
        String rating;
        String ratingLabel;
        String summary;

        if (totalScore >= 85) {
            rating = "EXCELLENT";
            ratingLabel = "Xuất sắc";
            summary = "Sức khỏe tài chính rất vững vàng! Bạn đang kiểm soát chi tiêu và tích lũy dòng tiền mẫu mực.";
            if (adviceList.isEmpty()) {
                adviceList.add("Tiếp tục duy trì kỷ luật tuyệt vời này và cân nhắc phân bổ dòng tiền nhàn rỗi vào các kênh đầu tư dài hạn.");
            }
        } else if (totalScore >= 70) {
            rating = "GOOD";
            ratingLabel = "Tốt";
            summary = "Tài chính của bạn đang ở mức ổn định. Chỉ cần tối ưu thêm một số khoản chi nhỏ để đạt mức xuất sắc.";
        } else if (totalScore >= 50) {
            rating = "FAIR";
            ratingLabel = "Trung bình";
            summary = "Cần chú ý! Dòng tiền hoặc ngân sách đang tiệm cận mức rủi ro, hãy xem xét thắt chặt các khoản chi không cần thiết.";
        } else {
            rating = "AT_RISK";
            ratingLabel = "Báo động";
            summary = "Cảnh báo nguy cơ mất cân đối tài chính! Dòng tiền đang bị âm hoặc bội chi, cần tái cơ cấu kế hoạch chi tiêu ngay.";
        }

        FinancialHealthResponse.HealthBreakdown breakdown = FinancialHealthResponse.HealthBreakdown.builder()
                .savingsScore(savingsScore)
                .savingsRatePercentage(savingsRatePct)
                .monthlyIncome(monthlyIncome)
                .monthlySpending(monthlySpending)
                .budgetScore(budgetScore)
                .budgetUsedPercentage(budgetUsedPct)
                .totalBudgetLimit(totalBudgetLimit)
                .emergencyFundScore(emergencyScore)
                .emergencyMonthsCovered(emergencyMonths)
                .totalBalance(totalBalance)
                .goalScore(goalScore)
                .activeGoalsCount(activeGoalsCount)
                .averageGoalProgress(avgGoalProgress)
                .build();

        return FinancialHealthResponse.builder()
                .score(totalScore)
                .rating(rating)
                .ratingLabel(ratingLabel)
                .summary(summary)
                .breakdown(breakdown)
                .advice(adviceList)
                .build();
    }

    /**
     * Trụ cột 1: Tỷ lệ tiết kiệm (Tối đa 30 điểm)
     */
    private int calculateSavingsScore(BigDecimal income, BigDecimal spending, List<String> advice) {
        if (income.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal net = income.subtract(spending);
            double rate = net.divide(income, 4, RoundingMode.HALF_UP).doubleValue();

            if (rate >= 0.20) {
                return 30; // Tiết kiệm >= 20% thu nhập
            } else if (rate >= 0.10) {
                return 20; // 10% - 20%
            } else if (rate >= 0.0) {
                advice.add("Tỷ lệ tiết kiệm tháng này khá thấp (< 10%). Hãy đặt mục tiêu tiết kiệm tối thiểu 20% theo quy tắc 50/30/20.");
                return 10; // 0% - 10%
            } else {
                advice.add("Cảnh báo: Chi tiêu đang vượt quá thu nhập tháng này (bội chi dòng tiền). Hãy cắt giảm ngay các khoản chi ngoài kế hoạch.");
                return 0; // Chi > Thu
            }
        }

        // Chưa có ghi nhận thu nhập
        if (spending.compareTo(BigDecimal.ZERO) == 0) {
            return 15; // Không có thu cũng không có chi
        } else {
            advice.add("Ghi nhận chi tiêu nhưng chưa có bản ghi thu nhập nào trong tháng. Hãy cập nhật các khoản thu nhập của bạn.");
            return 5;
        }
    }

    /**
     * Trụ cột 2: Kỷ luật ngân sách (Tối đa 30 điểm)
     */
    private int calculateBudgetScore(BigDecimal budgetLimit, BigDecimal spending, BigDecimal income, List<String> advice) {
        if (budgetLimit.compareTo(BigDecimal.ZERO) > 0) {
            double usedRatio = spending.divide(budgetLimit, 4, RoundingMode.HALF_UP).doubleValue();

            if (usedRatio <= 0.80) {
                return 30; // Chi tiêu <= 80% ngân sách
            } else if (usedRatio <= 1.00) {
                return 20; // Chi tiêu 80% - 100%
            } else if (usedRatio <= 1.15) {
                advice.add("Bạn đang chi tiêu vượt nhẹ ngân sách đã đặt ra (" + Math.round(usedRatio * 100) + "%). Hãy hạn chế các khoản phát sinh cuối tháng.");
                return 10;
            } else {
                advice.add("Báo động: Bạn đã chi vượt hơn 15% hạn mức ngân sách. Hãy xem xét rà soát lại các danh mục chi lớn.");
                return 0;
            }
        }

        // Chưa đặt hạn mức ngân sách
        if (income.compareTo(BigDecimal.ZERO) > 0) {
            double spendRatio = spending.divide(income, 4, RoundingMode.HALF_UP).doubleValue();
            if (spendRatio <= 0.80) {
                advice.add("Bạn chưa thiết lập ngân sách tháng. Hãy tạo ngân sách cho các danh mục để theo dõi chi tiêu chủ động hơn.");
                return 20;
            } else {
                advice.add("Chưa có ngân sách và chi tiêu chiếm hơn 80% thu nhập. Hãy đặt hạn mức ngân sách ngay để tránh hao hụt.");
                return 10;
            }
        }

        advice.add("Hãy thiết lập hạn mức ngân sách đầu tháng để xây dựng kế hoạch tài chính rõ ràng.");
        return 15;
    }

    /**
     * Trụ cột 3: Đệm dự phòng an toàn (Tối đa 25 điểm)
     */
    private int calculateEmergencyFundScore(BigDecimal totalBalance, BigDecimal spending, List<String> advice) {
        if (spending.compareTo(BigDecimal.ZERO) > 0) {
            double months = totalBalance.divide(spending, 2, RoundingMode.HALF_UP).doubleValue();

            if (months >= 3.0) {
                return 25; // Đủ trang trải >= 3 tháng
            } else if (months >= 1.0) {
                advice.add("Quỹ dự phòng hiện tại chỉ đủ duy trì từ 1 - 3 tháng chi tiêu. Hãy tích lũy thêm để đạt mức an toàn tối thiểu 3 - 6 tháng.");
                return 15;
            } else if (months > 0.0) {
                advice.add("Cảnh báo: Số dư ví hiện tại chưa đủ cho 1 tháng chi tiêu cơ bản. Hãy cẩn trọng trước các rủi ro bất ngờ.");
                return 8;
            } else {
                advice.add("Nguy hiểm: Tổng số dư ví đang bị âm hoặc cạn kiệt. Hãy bổ sung dòng tiền dự phòng khẩn cấp.");
                return 0;
            }
        }

        // Chưa có chi tiêu tháng này
        if (totalBalance.compareTo(BigDecimal.ZERO) > 0) {
            return 25;
        } else if (totalBalance.compareTo(BigDecimal.ZERO) == 0) {
            advice.add("Số dư các ví hiện bằng 0. Hãy nạp tiền vào ví hoặc liên kết tài khoản để kích hoạt quản lý dòng tiền.");
            return 10;
        } else {
            return 0;
        }
    }

    /**
     * Trụ cột 4: Mục tiêu tiết kiệm (Tối đa 15 điểm)
     */
    private int calculateGoalScore(List<SavingGoal> goals, List<String> advice) {
        if (goals == null || goals.isEmpty()) {
            advice.add("Tạo ngay Mục tiêu tiết kiệm (mua nhà, mua xe, du lịch...) để có động lực tích lũy định kỳ hàng tháng.");
            return 5;
        }

        boolean hasProgress = false;
        boolean hasCompleted = false;

        for (SavingGoal g : goals) {
            if (g.getStatus() == GoalStatus.COMPLETED) {
                hasCompleted = true;
            } else if (g.getStatus() == GoalStatus.IN_PROGRESS) {
                if (g.getCurrentAmount() != null && g.getCurrentAmount().compareTo(BigDecimal.ZERO) > 0) {
                    hasProgress = true;
                }
            }
        }

        if (hasCompleted || hasProgress) {
            return 15;
        }

        advice.add("Bạn đã tạo mục tiêu tiết kiệm nhưng chưa nạp tiền vào. Hãy trích một phần thu nhập để bắt đầu tích lũy!");
        return 8;
    }
}

