package com.budglee.finance.service;

import com.budglee.finance.dto.BudgetRequest;
import com.budglee.finance.entity.Budget;
import com.budglee.finance.entity.Category;
import com.budglee.finance.entity.User;
import com.budglee.finance.repository.BudgetRepository;
import com.budglee.finance.repository.CategoryRepository;
import com.budglee.finance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    @Transactional
    public Budget createOrUpdateBudget(Long userId, BudgetRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng ID: " + userId));

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId()).orElse(null);
        }

        Budget budget = budgetRepository.findByUserIdAndCategoryIdAndPeriodMonthAndPeriodYear(
                userId, request.getCategoryId(), request.getPeriodMonth(), request.getPeriodYear()
        ).orElseGet(() -> Budget.builder()
                .user(user)
                .category(category)
                .periodMonth(request.getPeriodMonth())
                .periodYear(request.getPeriodYear())
                .spentAmount(BigDecimal.ZERO)
                .build());

        budget.setAmountLimit(request.getAmountLimit());
        if (request.getAlertThreshold() != null) {
            budget.setAlertThreshold(request.getAlertThreshold());
        }

        return budgetRepository.save(budget);
    }

    @Transactional(readOnly = true)
    public List<Budget> getUserBudgets(Long userId, Integer month, Integer year) {
        return budgetRepository.findByUserIdAndPeriodMonthAndPeriodYear(userId, month, year);
    }
}
