package com.budglee.finance.ai;

import com.budglee.finance.ai.dto.ToolConfirmationDto;
import com.budglee.finance.ai.service.AiToolExecutorService;
import com.budglee.finance.entity.*;
import com.budglee.finance.repository.*;
import com.budglee.finance.service.FinancialHealthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiFinancialToolsTest {

    @Mock
    private WalletRepository walletRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private BudgetRepository budgetRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FamilyGroupRepository familyGroupRepository;

    @Mock
    private FinancialHealthService financialHealthService;

    private AiToolExecutorService toolExecutor;

    private User mockUser;
    private Wallet mockWallet;

    @BeforeEach
    void setUp() {
        toolExecutor = new AiToolExecutorService(
                walletRepository,
                transactionRepository,
                budgetRepository,
                categoryRepository,
                userRepository,
                familyGroupRepository,
                financialHealthService
        );

        mockUser = User.builder()
                .id(1L)
                .email("test@example.com")
                .fullName("Test User")
                .role(Role.INDIVIDUAL_USER)
                .build();

        mockWallet = Wallet.builder()
                .id(10L)
                .user(mockUser)
                .walletName("Ví Tiền mặt")
                .balance(new BigDecimal("500000"))
                .type(WalletType.CASH)
                .build();
    }

    @Test
    @DisplayName("Tool: Tra cứu số dư ví trả về đúng số liệu từ database")
    void getWalletBalances_returnsUserWallets() {
        when(walletRepository.findByUserId(1L)).thenReturn(List.of(mockWallet));

        Map<String, Object> result = toolExecutor.getWalletBalances(1L);

        assertThat(result.get("status")).isEqualTo("success");
        assertThat(result.get("totalBalance")).isEqualTo(new BigDecimal("500000"));
        List<Map<String, Object>> wallets = (List<Map<String, Object>>) result.get("wallets");
        assertThat(wallets).hasSize(1);
        assertThat(wallets.get(0).get("name")).isEqualTo("Ví Tiền mặt");
    }

    @Test
    @DisplayName("Human-in-the-loop: Chuẩn bị ghi nhận chi tiêu tạo ToolConfirmationDto và chưa thay đổi database")
    void prepareCreateTransaction_createsConfirmation() {
        when(walletRepository.findByUserId(1L)).thenReturn(List.of(mockWallet));

        ToolConfirmationDto confirm = toolExecutor.prepareCreateTransaction(
                1L, new BigDecimal("50000"), "EXPENSE", "Ăn uống", "Ví Tiền mặt", "Ăn trưa bún bò"
        );

        assertThat(confirm).isNotNull();
        assertThat(confirm.getConfirmationId()).startsWith("tx_confirm_");
        assertThat(confirm.getActionType()).isEqualTo("EXPENSE");
        assertThat(confirm.getAmount()).isEqualByComparingTo("50000");
        assertThat(confirm.getWalletName()).isEqualTo("Ví Tiền mặt");
        assertThat(confirm.getCategoryName()).isEqualTo("Ăn uống");

        // Database chưa bị lưu thay đổi
        verify(transactionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Human-in-the-loop: Thực thi giao dịch sau khi người dùng xác nhận")
    void executeConfirmedAction_savesTransactionAndUpdatesWallet() {
        when(walletRepository.findByUserId(1L)).thenReturn(List.of(mockWallet));
        when(walletRepository.findById(10L)).thenReturn(Optional.of(mockWallet));
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(categoryRepository.findAllAvailableForUser(1L)).thenReturn(List.of());

        ToolConfirmationDto confirm = toolExecutor.prepareCreateTransaction(
                1L, new BigDecimal("50000"), "EXPENSE", "Ăn uống", "Ví Tiền mặt", "Ăn trưa"
        );

        Map<String, Object> execResult = toolExecutor.executeConfirmedAction(1L, confirm.getConfirmationId());

        assertThat(execResult.get("status")).isEqualTo("success");
        assertThat(mockWallet.getBalance()).isEqualByComparingTo("450000"); // 500k - 50k
        verify(walletRepository).save(mockWallet);
        verify(transactionRepository).save(any(Transaction.class));
    }

    @Test
    @DisplayName("Chống IDOR: Người dùng khác không được thực thi confirmation của người khác")
    void executeConfirmedAction_blocksOtherUser_idorProtection() {
        when(walletRepository.findByUserId(1L)).thenReturn(List.of(mockWallet));

        ToolConfirmationDto confirm = toolExecutor.prepareCreateTransaction(
                1L, new BigDecimal("50000"), "EXPENSE", "Ăn uống", "Ví Tiền mặt", "Ăn trưa"
        );

        // User 2L cố tình thực thi action của User 1L
        assertThatThrownBy(() -> toolExecutor.executeConfirmedAction(2L, confirm.getConfirmationId()))
                .isInstanceOf(SecurityException.class);
    }

    @Test
    @DisplayName("Quick Transaction: Khi người dùng nói 'thẻ vietinbank' nhưng chưa có ví riêng, tự động dùng ví ngân hàng hoặc ví khả dụng")
    void prepareCreateTransaction_withBankCardFallback_handlesNonExactWalletName() {
        Wallet mockBankWallet = Wallet.builder()
                .id(20L)
                .user(mockUser)
                .walletName("Tài khoản Ngân hàng")
                .balance(new BigDecimal("1000000"))
                .type(WalletType.BANK)
                .build();

        when(walletRepository.findByUserId(1L)).thenReturn(List.of(mockWallet, mockBankWallet));

        ToolConfirmationDto confirm = toolExecutor.prepareCreateTransaction(
                1L, new BigDecimal("20000"), "EXPENSE", "cà phê", "thẻ vietinbank", "vừa tiêu cà phê 20000đ vào thẻ vietinbank"
        );

        assertThat(confirm).isNotNull();
        assertThat(confirm.getAmount()).isEqualByComparingTo("20000");
        assertThat(confirm.getWalletName()).isEqualTo("Tài khoản Ngân hàng");
        assertThat(confirm.getCategoryName()).isEqualTo("cà phê");
    }

    @Test
    @DisplayName("Category Mapping: 'cà phê' tự động map vào danh mục 'Food & Drinks'")
    void executeConfirmedAction_mapsCoffeeCategoryToFoodAndDrinks() {
        Category foodCategory = Category.builder()
                .id(100L)
                .name("Food & Drinks")
                .type(CategoryType.EXPENSE)
                .build();

        when(walletRepository.findByUserId(1L)).thenReturn(List.of(mockWallet));
        when(walletRepository.findById(10L)).thenReturn(Optional.of(mockWallet));
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(categoryRepository.findAllAvailableForUser(1L)).thenReturn(List.of(foodCategory));

        ToolConfirmationDto confirm = toolExecutor.prepareCreateTransaction(
                1L, new BigDecimal("20000"), "EXPENSE", "cà phê", "Ví Tiền mặt", "vừa tiêu cà phê 20000đ"
        );

        Map<String, Object> result = toolExecutor.executeConfirmedAction(1L, confirm.getConfirmationId());

        assertThat(result.get("status")).isEqualTo("success");
        verify(transactionRepository).save(argThat(tx -> 
                tx.getCategory() != null && "Food & Drinks".equals(tx.getCategory().getName())
        ));
    }
}

