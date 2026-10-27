package com.budglee.finance.service;

import com.budglee.finance.dto.BudgetRequest;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * =========================================================================
 * SERVICE: QUẢN LÝ NGÂN SÁCH (BUDGETS)
 * Phụ trách: Nguyễn Trường An (Backend Lead) — nhánh 'an'
 *
 * Quy tắc đã cài đặt:
 * 1. Một ngân sách cho (user, danh mục, tháng, năm); đặt lại kỳ cũ thì cập nhật, không tạo bản trùng.
 * 2. categoryId = null là hạn mức tổng của cả kỳ; chỉ danh mục loại EXPENSE mới được đặt ngân sách.
 * 3. spent_amount tính trực tiếp từ giao dịch EXPENSE khi đọc nên không lệch với lịch sử chi.
 * 4. alertLevel = OK / WARNING (>= alertThreshold, mặc định 80%) / EXCEEDED (>= 100%).
 * =========================================================================
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;

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

        BigDecimal threshold = request.getAlertThreshold() == null
                ? new BigDecimal("80.00")
                : request.getAlertThreshold();

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
        budget.setAlertThreshold(threshold);

        Budget saved = budgetRepository.save(budget);
        log.info("{} ngân sách id={} danh mục={} kỳ={}/{} hạn mức={} ngưỡng cảnh báo={}",
                isNew ? "Tạo" : "Cập nhật", saved.getId(),
                category == null ? "toàn bộ" : category.getName(),
                saved.getPeriodMonth(), saved.getPeriodYear(),
                saved.getAmountLimit(), saved.getAlertThreshold());
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
    public List<Budget> getUserBudgets(Long userId, Integer month, Integer year) {
        List<Budget> budgets = budgetRepository.findByUserIdAndPeriodMonthAndPeriodYear(userId, month, year);
        if (budgets.isEmpty()) {
            return budgets;
        }

        LocalDate firstDay = LocalDate.of(year, month, 1);
        List<Transaction> expenses = transactionRepository.findByUserIdAndTransactionDateBetween(
                        userId, firstDay.atStartOfDay(), firstDay.plusMonths(1).atStartOfDay())
                .stream()
                .filter(t -> t.getTransactionType() == TransactionType.EXPENSE)
                .toList();

        Map<Long, BigDecimal> spentByCategory = new HashMap<>();
        BigDecimal spentTotal = BigDecimal.ZERO;
        for (Transaction expense : expenses) {
            spentTotal = spentTotal.add(expense.getAmount());
            if (expense.getCategory() != null) {
                spentByCategory.merge(expense.getCategory().getId(), expense.getAmount(), BigDecimal::add);
            }
        }

        for (Budget budget : budgets) {
            BigDecimal spent = budget.getCategory() == null
                    ? spentTotal
                    : spentByCategory.getOrDefault(budget.getCategory().getId(), BigDecimal.ZERO);
            budget.setSpentAmount(spent);
            if (!"OK".equals(budget.getAlertLevel())) {
                log.warn("Ngân sách id={} đạt ngưỡng {} ({} / {})",
                        budget.getId(), budget.getAlertLevel(), spent, budget.getAmountLimit());
            }
        }
        return budgets;
    }
}
