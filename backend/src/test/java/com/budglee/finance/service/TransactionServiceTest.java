package com.budglee.finance.service;

import com.budglee.finance.dto.TransactionRequest;
import com.budglee.finance.entity.Category;
import com.budglee.finance.entity.Transaction;
import com.budglee.finance.entity.TransactionType;
import com.budglee.finance.entity.User;
import com.budglee.finance.entity.Wallet;
import com.budglee.finance.entity.WalletType;
import com.budglee.finance.repository.CategoryRepository;
import com.budglee.finance.repository.TransactionRepository;
import com.budglee.finance.repository.UserRepository;
import com.budglee.finance.repository.WalletRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class TransactionServiceTest {
    private TransactionRepository transactionRepository;
    private WalletRepository walletRepository;
    private CategoryRepository categoryRepository;
    private UserRepository userRepository;

    private TransactionService transactionService;

    private User user;
    private Wallet wallet;

    @BeforeEach
    void setUp() {
        transactionRepository = mock(TransactionRepository.class);
        walletRepository = mock(WalletRepository.class);
        categoryRepository = mock(CategoryRepository.class);
        userRepository = mock(UserRepository.class);

        transactionService = new TransactionService(transactionRepository, walletRepository,
                categoryRepository, userRepository);

        user = User.builder().id(1L).fullName("Test User").email("test@example.com")
                .passwordHash("hashed-password").build();

        wallet = Wallet.builder()
                .id(10L)
                .user(user)
                .walletName("Ví tiền mặt")
                .type(WalletType.CASH)
                .balance(new BigDecimal("1000000"))
                .currency("VND")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(walletRepository.findById(10L)).thenReturn(Optional.of(wallet));
        when(walletRepository.save(any(Wallet.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(transactionRepository.save(any(Transaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    private TransactionRequest createRequest(TransactionType type, String amount) {
        TransactionRequest request = new TransactionRequest();
        request.setWalletId(10L);
        request.setActionTitle("  Test transaction  ");
        request.setAmount(new BigDecimal(amount));
        request.setTransactionType(type);
        return request;
    }

    @Test
    void createTransaction_income_shouldIncreaseWalletBalance() {
        TransactionRequest request = createRequest(TransactionType.INCOME, "500000");

        Transaction result = transactionService.createTransaction(1L, request);

        assertEquals(new BigDecimal("1500000"), wallet.getBalance());
        assertEquals(new BigDecimal("1500000"), result.getBalanceAfter());
        assertEquals("Test transaction", result.getActionTitle());
        assertEquals(TransactionType.INCOME, result.getTransactionType());

        verify(walletRepository).save(wallet);
        verify(transactionRepository).save(any(Transaction.class));
    }

    @Test
    void createTransaction_expense_shouldDecreaseWalletBalance() {
        TransactionRequest request = createRequest(TransactionType.EXPENSE, "200000");

        Transaction result = transactionService.createTransaction(1L, request);

        assertEquals(new BigDecimal("800000"), wallet.getBalance());
        assertEquals(new BigDecimal("800000"), result.getBalanceAfter());

        verify(walletRepository).save(wallet);
        verify(transactionRepository).save(any(Transaction.class));
    }

    @Test
    void createTransaction_insufficientBalance_shouldThrowBadRequest() {
        TransactionRequest request = createRequest(TransactionType.EXPENSE, "1500000");

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> transactionService.createTransaction(1L, request)
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        assertEquals(new BigDecimal("1000000"), wallet.getBalance());

        verify(walletRepository, never()).save(any(Wallet.class));
        verify(transactionRepository, never()).save(any(Transaction.class));
    }

    @Test
    void createTransaction_creditCard_shouldAllowNegativeBalance() {
        wallet.setType(WalletType.CREDIT_CARD);

        TransactionRequest request = createRequest(TransactionType.EXPENSE, "1500000");

        Transaction result = transactionService.createTransaction(1L, request);

        assertEquals(new BigDecimal("-500000"), wallet.getBalance());
        assertEquals(new BigDecimal("-500000"), result.getBalanceAfter());

        verify(walletRepository).save(wallet);
        verify(transactionRepository).save(any(Transaction.class));
    }

    @Test
    void createTransaction_transfer_shouldThrowNotImplemented() {
        TransactionRequest request = createRequest(TransactionType.TRANSFER, "100000");

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> transactionService.createTransaction(1L, request)
        );

        assertEquals(HttpStatus.NOT_IMPLEMENTED, exception.getStatusCode());

        verify(walletRepository, never()).save(any(Wallet.class));
        verify(transactionRepository, never()).save(any(Transaction.class));
    }

    @Test
    void createTransaction_userNotFound_shouldThrowUnauthorized() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        TransactionRequest request = createRequest(TransactionType.INCOME, "100000");

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> transactionService.createTransaction(99L, request)
        );

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatusCode());

        verify(transactionRepository, never()).save(any(Transaction.class));
    }

    @Test
    void createTransaction_walletNotOwnedByUser_shouldThrowNotFound() {
        User anotherUser = User.builder().id(2L).build();

        Wallet anotherWallet = Wallet.builder().id(20L).user(anotherUser)
                .balance(new BigDecimal("100000"))
                .type(WalletType.CASH)
                .build();

        when(walletRepository.findById(20L)).thenReturn(Optional.of(anotherWallet));

        TransactionRequest request = createRequest(TransactionType.EXPENSE, "10000");
        request.setWalletId(20L);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> transactionService.createTransaction(1L, request)
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());

        verify(transactionRepository, never()).save(any(Transaction.class));
    }

    @Test
    void getUserTransactions_shouldReturnRepositoryResult() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Transaction> expected = new PageImpl<>(List.of());

        when(transactionRepository.findByUserIdOrderByTransactionDateDesc(1L, pageable))
                .thenReturn(expected);

        Page<Transaction> result = transactionService.getUserTransactions(1L, pageable);

        assertSame(expected, result);

        verify(transactionRepository).findByUserIdOrderByTransactionDateDesc(1L, pageable);
    }
}