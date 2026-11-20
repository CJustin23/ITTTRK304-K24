package com.budglee.finance.dto;

import com.budglee.finance.entity.GoalStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavingGoalResponse {
    private Long id;
    private String goalName;
    private BigDecimal targetAmount;
    private BigDecimal currentAmount;
    private LocalDate deadline;
    private GoalStatus status;
    private double progressPercentage;
    private List<GoalContributorDto> contributors;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GoalContributorDto {
        private Long userId;
        private String userName;
        private String userEmail;
        private String avatarUrl;
        private BigDecimal totalAmount;
        private int depositCount;
        private int percentage;
        private LocalDateTime lastDepositAt;
    }
}

