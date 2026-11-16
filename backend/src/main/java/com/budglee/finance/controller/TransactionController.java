package com.budglee.finance.controller;

import com.budglee.finance.dto.ApiResponse;
import com.budglee.finance.dto.TransactionRequest;
import com.budglee.finance.dto.TransactionUpdateRequest;
import com.budglee.finance.entity.Transaction;
import com.budglee.finance.security.UserPrincipal;
import com.budglee.finance.service.TransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
@Tag(name = "Transactions", description = "Quản lý Giao dịch thu/chi & Lịch sử hoạt động")
public class TransactionController {

    /**
     * size đến từ query nên client gửi bao nhiêu cũng được; PageRequest.of không chặn gì cả.
     * Không giới hạn thì một request "size=1000000" kéo toàn bộ lịch sử của người dùng về
     * memory, và trên VPS 2GB đó là cách nhanh nhất để bị OOM.
     */
    private static final int MAX_PAGE_SIZE = 100;

    private final TransactionService transactionService;

    @PostMapping
    @Operation(summary = "Tạo giao dịch thu / chi / chuyển khoản mới")
    public ResponseEntity<ApiResponse<Transaction>> createTransaction(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody TransactionRequest request) {
        Transaction tx = transactionService.createTransaction(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.ok(tx, "Ghi nhận giao dịch thành công"));
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách giao dịch phân trang của người dùng")
    public ResponseEntity<ApiResponse<Page<Transaction>>> getTransactions(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Transaction> result = transactionService.getUserTransactions(
                currentUser.getId(), PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE)));
        return ResponseEntity.ok(ApiResponse.ok(result, "Lấy danh sách giao dịch thành công"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin giao dịch và điều chỉnh lại số dư ví")
    public ResponseEntity<ApiResponse<Transaction>> updateTransaction(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id,
            @Valid @RequestBody TransactionUpdateRequest request) {
        Transaction tx = transactionService.updateTransaction(currentUser.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.ok(tx, "Cập nhật giao dịch thành công"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa giao dịch và hoàn lại số dư ví")
    public ResponseEntity<ApiResponse<Void>> deleteTransaction(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id) {
        transactionService.deleteTransaction(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Xóa giao dịch và hoàn số dư thành công"));
    }
}