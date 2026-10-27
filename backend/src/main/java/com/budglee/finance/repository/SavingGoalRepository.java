package com.budglee.finance.repository;

import com.budglee.finance.entity.GoalStatus;
import com.budglee.finance.entity.SavingGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SavingGoalRepository extends JpaRepository<SavingGoal, Long> {
    List<SavingGoal> findByUserId(Long userId);
    List<SavingGoal> findByUserIdAndStatus(Long userId, GoalStatus status);
}
