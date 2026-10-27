package com.budglee.finance.repository;

import com.budglee.finance.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {
    List<Budget> findByUserIdAndPeriodMonthAndPeriodYear(Long userId, Integer month, Integer year);
    Optional<Budget> findByUserIdAndCategoryIdAndPeriodMonthAndPeriodYear(
            Long userId, Long categoryId, Integer month, Integer year);
}
