package com.budglee.finance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HabitRecommendationResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private String status; // "ON_TRACK", "WARNING", "OVERSPENT"
    private String primaryAdvice;
    private List<String> actionItems;
    private List<CategoryWarning> categoryWarnings;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryWarning implements Serializable {
        private String categoryName;
        private Double increasePercentage;
        private String recommendation;
    }
}
