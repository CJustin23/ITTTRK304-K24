package com.budglee.finance.service;

import com.budglee.finance.dto.BudgetRequest;
import com.budglee.finance.dto.BudgetResponse;
import com.budglee.finance.entity.Budget;
import com.budglee.finance.entity.Category;
import com.budglee.finance.entity.CategoryType;
import com.budglee.finance.entity.Transaction;
import com.budglee.finance.entity.TransactionType;
import com.budglee.finance.entity.User;
import com.budglee.finance.repository.BudgetRepository;
import com.budglee.finance.repository.CategoryRepository;
import com.budglee.finance.repository.TransactionRepository;
import com.budglee.finance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * =========================================================================
 * SERVICE: QUẢN LÝ NGÂN SÁCH (BUDGETS)
 * Phụ trách: Nguyễn Trường An (Backend Lead) — nhánh 'an'
 *
 * Quy tắc đã cài đặt:
 * 1. Một ngân sách cho bộ (người dùng, danh mục, tháng, năm); đặt lại kỳ cũ thì cập nhật
 *    hạn mức chứ không tạo bản trùng.
 * 2. categoryId = null nghĩa là hạn mức tổng của cả kỳ; chỉ danh mục loại EXPENSE mới có ngân sách.
 * 3. spent_amount tính trực tiếp từ giao dịch EXPENSE trong kỳ khi đọc, không tính hai bản ghi
 *    của một lần chuyển giữa hai ví, nên tiến độ không bao giờ lệch với lịch sử chi. Kết quả trả
 *    về ở BudgetResponse: transaction đang chỉ-read mà gán ngược vào entity thì Hibernate không
 *    flush, cột spent_amount dưới CSDL mãi mãi là số cũ.
 * 4. alertLevel = OK / WARNING (>= alertThreshold, mặc định 80%) / EXCEEDED (>= 100%).
 * =========================================================================
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BudgetService {
    private static final BigDecimal DEFAULT_ALERT_THRESHOLD = new BigDecimal("80.00");

    private final BudgetRepository budgetRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;

    @CacheEvict(value = {"dashboardSummary", "dashboardTrends"}, allEntries = true)
    @Transactional
    public Budget createOrUpdateBudget(Long userId, BudgetRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tài khoản không còn tồn tại"));

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .filter(c -> c.getUser() == null || userId.equals(c.getUser().getId()))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Danh mục không tồn tại hoặc không thuộc về bạn"));
            if (category.getType() != CategoryType.EXPENSE) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Ngân sách chỉ đặt cho danh mục chi (EXPENSE)");
            }
        }

        Budget budget = findExisting(user.getId(), request, category);
        boolean isNew = budget == null;
        if (isNew) {
            budget = Budget.builder()
                    .user(user)
                    .category(category)
                    .periodMonth(request.getPeriodMonth())
                    .periodYear(request.getPeriodYear())
                    .build();
        }
        budget.setAmountLimit(request.getAmountLimit());
        budget.setAlertThreshold(request.getAlertThreshold() == null
                ? DEFAULT_ALERT_THRESHOLD
                : request.getAlertThreshold());

        Budget saved = budgetRepository.save(budget);
        log.info("{} ngân sách id={} danh mục={} kỳ={}/{} hạn mức={} ngưỡng={}",
                isNew ? "Tạo" : "Cập nhật", saved.getId(),
                category == null ? "toàn kỳ" : category.getName(),
                saved.getPeriodMonth(), saved.getPeriodYear(), saved.getAmountLimit(), saved.getAlertThreshold());
        return saved;
    }

    private Budget findExisting(Long userId, BudgetRequest request, Category category) {
        if (category != null) {
            return budgetRepository.findByUserIdAndCategoryIdAndPeriodMonthAndPeriodYear(
                            userId, category.getId(), request.getPeriodMonth(), request.getPeriodYear())
                    .orElse(null);
        }
        return budgetRepository.findByUserIdAndPeriodMonthAndPeriodYear(
                        userId, request.getPeriodMonth(), request.getPeriodYear())
                .stream()
                .filter(b -> b.getCategory() == null)
                .findFirst()
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<BudgetResponse> getUserBudgets(Long userId, Integer month, Integer year) {
        List<Budget> budgets = budgetRepository.findByUserIdAndPeriodMonthAndPeriodYear(userId, month, year);
        if (budgets.isEmpty()) {
            return List.of();
        }

        LocalDate firstDay = LocalDate.of(year, month, 1);
        LocalDate lastDay = firstDay.withDayOfMonth(firstDay.lengthOfMonth());
        java.time.LocalDateTime startDateTime = firstDay.atStartOfDay();
        java.time.LocalDateTime endDateTime = lastDay.atTime(java.time.LocalTime.MAX);

        // Tối ưu hóa Sprint 4 - Tú: Dùng SQL Aggregate trực tiếp thay vì load toàn bộ Entity Transaction vào RAM
        BigDecimal spentTotal = transactionRepository.getTotalAmountByTypeAndPeriod(
                userId, TransactionType.EXPENSE, startDateTime, endDateTime);
        if (spentTotal == null) spentTotal = BigDecimal.ZERO;

        Map<Long, BigDecimal> spentByCategory = new HashMap<>();
        List<Object[]> categorySums = transactionRepository.getCategoryExpenseSums(
                userId, startDateTime, endDateTime);
        if (categorySums != null) {
            for (Object[] row : categorySums) {
                if (row != null && row.length >= 2 && row[0] != null && row[1] != null) {
                    spentByCategory.put((Long) row[0], (BigDecimal) row[1]);
                }
            }
        }

        List<BudgetResponse> responses = new ArrayList<>(budgets.size());
        for (Budget budget : budgets) {
            BigDecimal spent = budget.getCategory() == null ? spentTotal
                    : spentByCategory.getOrDefault(budget.getCategory().getId(), BigDecimal.ZERO);
            String alertLevel = Budget.alertLevelOf(spent, budget.getAmountLimit(), budget.getAlertThreshold());
            if (!"OK".equals(alertLevel)) {
                log.warn("Ngân sách id={} đạt ngưỡng {} ({} / {})",
                        budget.getId(), alertLevel, spent, budget.getAmountLimit());
            }
            Category category = budget.getCategory();
            responses.add(BudgetResponse.builder()
                    .id(budget.getId())
                    .categoryId(category == null ? null : category.getId())
                    .categoryName(category == null ? null : category.getName())
                    .categoryIcon(category == null ? null : category.getIcon())
                    .amountLimit(budget.getAmountLimit())
                    .spentAmount(spent)
                    .periodMonth(budget.getPeriodMonth())
                    .periodYear(budget.getPeriodYear())
                    .alertThreshold(budget.getAlertThreshold())
                    .alertLevel(alertLevel)
                    .build());
        }
        return responses;
    }
}
