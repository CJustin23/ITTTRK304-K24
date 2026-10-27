package com.budglee.finance.service;

import com.budglee.finance.dto.DashboardSummaryResponse;
import com.budglee.finance.repository.BudgetRepository;
import com.budglee.finance.repository.TransactionRepository;
import com.budglee.finance.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Collections;

/**
 * =========================================================================
 * KHUÔN MẪU SERVICE: THỐNG KÊ DASHBOARD & BỘ NHỚ ĐỆM (CACHE)
 * Phụ trách: 
 *   - Nguyễn Tiến Thành (API thống kê dòng tiền theo kỳ) - Nhánh: 'thanh'
 *   - Bàng Trọng Tú (Cấu hình Redis Cache tối ưu truy vấn) - Nhánh: 'tu'
 *
 * Yêu cầu nghiệp vụ cần làm:
 * 1. Tính toán tổng số dư các ví, tổng thu tháng, tổng chi tháng và left to spend.
 * 2. Gom nhóm tỷ trọng chi tiêu theo từng Category.
 * 3. Trả về mảng spentTrends phục vụ vẽ biểu đồ Recharts.
 * 4. Áp dụng @Cacheable lưu vào Redis Cache.
 * =========================================================================
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;

    public DashboardSummaryResponse getDashboardSummary(Long userId, int year, int month) {
        log.info("[TODO - THÀNH & TÚ] Cài đặt chức năng thống kê Dashboard và Redis cache cho userId: {}", userId);
        
        // TODO: Nguyễn Tiến Thành & Bàng Trọng Tú cài đặt logic tính toán và Redis cache tại đây
        return DashboardSummaryResponse.builder()
                .totalBalance(BigDecimal.ZERO)
                .monthlyIncome(BigDecimal.ZERO)
                .monthlySpending(BigDecimal.ZERO)
                .leftToSpend(BigDecimal.ZERO)
                .spendingPercentageOfBudget(0.0)
                .categoryExpenses(Collections.emptyMap())
                .spentTrends(Collections.emptyList())
                .build();
    }
}
