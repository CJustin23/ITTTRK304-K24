package com.budglee.finance.service;

import com.budglee.finance.dto.BudgetRequest;
import com.budglee.finance.dto.WalletRequest;
import com.budglee.finance.dto.WalletUpdateRequest;
import com.budglee.finance.security.UserPrincipal;
import org.junit.jupiter.api.Test;
import org.springframework.cache.annotation.CacheEvict;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;

class DashboardCacheEvictionTest {

    @Test
    void walletMutationsShouldEvictDashboardCaches() throws NoSuchMethodException {
        assertDashboardCachesEvicted(
                WalletService.class.getMethod("create", Long.class, WalletRequest.class));

        assertDashboardCachesEvicted(
                WalletService.class.getMethod("update",
                        Long.class, WalletUpdateRequest.class, UserPrincipal.class));

        assertDashboardCachesEvicted(
                WalletService.class.getMethod("delete",
                        Long.class, UserPrincipal.class));
    }

    @Test
    void budgetMutationShouldEvictDashboardCaches() throws NoSuchMethodException {
        assertDashboardCachesEvicted(
                BudgetService.class.getMethod("createOrUpdateBudget",
                        Long.class, BudgetRequest.class));
    }

    private void assertDashboardCachesEvicted(Method method) {
        CacheEvict cacheEvict = method.getAnnotation(CacheEvict.class);

        assertThat(cacheEvict)
                .as("Method %s must have CacheEvict", method.getName())
                .isNotNull();

        assertThat(cacheEvict.value())
                .containsExactly("dashboardSummary", "dashboardTrends");

        assertThat(cacheEvict.allEntries()).isTrue();
    }
}