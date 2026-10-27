package com.budglee.finance.service;

import com.budglee.finance.dto.BudgetRequest;
import com.budglee.finance.entity.Budget;
import com.budglee.finance.repository.BudgetRepository;
import com.budglee.finance.repository.CategoryRepository;
import com.budglee.finance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

/**
 * =========================================================================
 * KHUÔN MẪU SERVICE: QUẢN LÝ NGÂN SÁCH (BUDGETS)
 * Phụ trách: Nguyễn Trường An (Backend Lead)
 * Nhánh làm việc: 'an'
 *
 * Yêu cầu nghiệp vụ cần làm:
 * 1. Thiết lập hạn mức ngân sách theo tháng hoặc theo từng Category.
 * 2. Cập nhật cảnh báo khi chi tiêu đạt ngưỡng alertThreshold (80% / 100%).
 * =========================================================================
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    public Budget createOrUpdateBudget(Long userId, BudgetRequest request) {
        log.info("[TODO - AN] Cài đặt chức năng tạo/cập nhật hạn mức ngân sách cho userId: {}", userId);
        // TODO: Nguyễn Trường An cài đặt logic nghiệp vụ tại đây
        return null;
    }

    public List<Budget> getUserBudgets(Long userId, Integer month, Integer year) {
        log.info("[TODO - AN] Cài đặt chức năng lấy danh sách ngân sách cho userId: {}", userId);
        // TODO: Nguyễn Trường An cài đặt logic truy vấn tại đây
        return Collections.emptyList();
    }
}
