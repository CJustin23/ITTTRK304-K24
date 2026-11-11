package com.budglee.finance.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data @AllArgsConstructor
public class AdminStatsResponse {
    private long totalAccounts;
    private long disabledAccounts;
    private long familyGroups;
    private long transactionsLast24Hours;
}
