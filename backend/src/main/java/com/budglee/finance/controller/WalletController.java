package com.budglee.finance.controller;

import com.budglee.finance.dto.ApiResponse;
import com.budglee.finance.dto.WalletRequest;
import com.budglee.finance.dto.WalletUpdateRequest;
import com.budglee.finance.entity.Wallet;
import com.budglee.finance.security.UserPrincipal;
import com.budglee.finance.service.WalletService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/wallets")
@RequiredArgsConstructor
@Tag(name = "Wallets", description = "Quản lý Ví tiền & Thẻ ngân hàng")
public class WalletController {

    private final WalletService walletService;

    @GetMapping
    @Operation(summary = "Lấy danh sách ví của người dùng hiện tại")
    public ResponseEntity<ApiResponse<List<Wallet>>> getWallets(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<Wallet> wallets = walletService.list(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok(wallets, "Lấy danh sách ví thành công"));
    }

    @PostMapping
    @Operation(summary = "Tạo ví / thẻ mới cho người dùng hiện tại")
    public ResponseEntity<ApiResponse<Wallet>> createWallet(@AuthenticationPrincipal UserPrincipal currentUser,
                                                            @Valid @RequestBody WalletRequest request) {
        Wallet saved = walletService.create(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.ok(saved, "Tạo ví thành công"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Sửa ví của mình; số dư không đổi được qua API này")
    public ResponseEntity<ApiResponse<Wallet>> updateWallet(@AuthenticationPrincipal UserPrincipal currentUser,
                                                            @PathVariable Long id,
                                                            @Valid @RequestBody WalletUpdateRequest request) {
        Wallet updated = walletService.update(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(updated, "Cập nhật ví thành công"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xoá ví của mình; không xoá được ví đã có giao dịch")
    public ResponseEntity<ApiResponse<Void>> deleteWallet(@AuthenticationPrincipal UserPrincipal currentUser,
                                                          @PathVariable Long id) {
        walletService.delete(id, currentUser);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Xoá ví thành công")
                .build());
    }
}
