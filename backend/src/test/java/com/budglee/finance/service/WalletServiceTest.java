package com.budglee.finance.service;

import com.budglee.finance.dto.WalletRequest;
import com.budglee.finance.entity.User;
import com.budglee.finance.entity.Wallet;
import com.budglee.finance.entity.WalletType;
import com.budglee.finance.repository.UserRepository;
import com.budglee.finance.repository.TransactionRepository;
import com.budglee.finance.repository.WalletRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class WalletServiceTest {
    private WalletRepository walletRepository;
    private UserRepository userRepository;
    private TransactionRepository transactionRepository;
    private WalletService walletService;

    private User user;

    @BeforeEach
    void setUp() {
        walletRepository = mock(WalletRepository.class);
        userRepository = mock(UserRepository.class);
        transactionRepository = mock(TransactionRepository.class);

        walletService = new WalletService(walletRepository, userRepository, transactionRepository);

        user = User.builder()
                .id(1L)
                .fullName("Test User")
                .email("test@example.com")
                .passwordHash("hashed-password")
                .familyGroupId("FAMILY001")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        when(walletRepository.save(any(Wallet.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    private WalletRequest createRequest() {
        WalletRequest request = new WalletRequest();
        request.setWalletName("  Ví tiền mặt  ");
        request.setType(WalletType.CASH);
        return request;
    }

    @Test
    void create_shouldCreateWalletWithDefaultValues() {
        WalletRequest request = createRequest();

        Wallet result = walletService.create(1L, request);

        assertEquals("Ví tiền mặt", result.getWalletName());
        assertEquals(WalletType.CASH, result.getType());
        assertEquals("VND", result.getCurrency());
        assertEquals(BigDecimal.ZERO, result.getBalance());
        assertEquals("FAMILY001", result.getFamilyGroupId());
        assertSame(user, result.getUser());

        verify(walletRepository).save(any(Wallet.class));
    }

    @Test
    void create_shouldKeepProvidedBalanceAndCurrency() {
        WalletRequest request = createRequest();
        request.setBalance(new BigDecimal("500000"));
        request.setCurrency(" USD ");

        Wallet result = walletService.create(1L, request);

        assertEquals(new BigDecimal("500000"), result.getBalance());
        assertEquals("USD", result.getCurrency());
    }

    @Test
    void create_shouldTrimMaskedCardNumber() {
        WalletRequest request = createRequest();
        request.setCardNumberMasked("  **** **** 1234  ");

        Wallet result = walletService.create(1L, request);

        assertEquals("**** **** 1234", result.getCardNumberMasked());
    }

    @Test
    void create_shouldRejectFullCardNumber() {
        WalletRequest request = createRequest();
        request.setCardNumberMasked("1234567890123456");

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> walletService.create(1L, request)
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());

        verify(walletRepository, never()).save(any(Wallet.class));
    }

    @Test
    void create_shouldRejectWhenUserDoesNotExist() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        WalletRequest request = createRequest();

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> walletService.create(99L, request)
        );

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatusCode());

        verify(walletRepository, never()).save(any(Wallet.class));
    }

    @Test
    void list_shouldReturnWalletsOfUser() {
        List<Wallet> expected = List.of(
                Wallet.builder().id(10L).user(user).walletName("Ví tiền mặt")
                        .type(WalletType.CASH).balance(BigDecimal.ZERO).build()
        );

        when(walletRepository.findByUserId(1L)).thenReturn(expected);

        List<Wallet> result = walletService.list(1L);

        assertEquals(1, result.size());
        assertEquals(expected, result);

        verify(walletRepository).findByUserId(1L);
    }

    @Test
    void consolidate_shouldMergeCashWalletsAndSameCardBankWallets() {
        List<Wallet> raw = List.of(
                Wallet.builder().id(1L).walletName("vietinbank").type(WalletType.CASH).balance(new BigDecimal("250000")).build(),
                Wallet.builder().id(2L).walletName("Tiền mặt").type(WalletType.CASH).balance(new BigDecimal("2000000")).build(),
                Wallet.builder().id(3L).walletName("VietinBank").type(WalletType.BANK).cardNumberMasked("**** 8529").balance(new BigDecimal("2000000")).build(),
                Wallet.builder().id(4L).walletName("VietinBank").type(WalletType.BANK).cardNumberMasked("**** 8529").balance(new BigDecimal("5000000")).build(),
                Wallet.builder().id(5L).walletName("VietinBank").type(WalletType.BANK).cardNumberMasked("**** 1234").balance(new BigDecimal("1000000")).build()
        );

        List<Wallet> consolidated = walletService.consolidate(raw);

        // Expect 3 consolidated wallets: 1 merged CASH, 1 merged VietinBank (8529), 1 separate VietinBank (1234)
        assertEquals(3, consolidated.size());

        Wallet cash = consolidated.stream().filter(w -> w.getType() == WalletType.CASH).findFirst().orElseThrow();
        assertEquals("Tiền mặt", cash.getWalletName());
        assertEquals(new BigDecimal("2250000"), cash.getBalance());

        Wallet bank8529 = consolidated.stream()
                .filter(w -> w.getType() == WalletType.BANK && "VietinBank".equals(w.getWalletName()) && w.getCardNumberMasked().contains("8529"))
                .findFirst().orElseThrow();
        assertEquals(new BigDecimal("7000000"), bank8529.getBalance());

        Wallet bank1234 = consolidated.stream()
                .filter(w -> w.getType() == WalletType.BANK && "VietinBank".equals(w.getWalletName()) && w.getCardNumberMasked().contains("1234"))
                .findFirst().orElseThrow();
        assertEquals(new BigDecimal("1000000"), bank1234.getBalance());
    }
}