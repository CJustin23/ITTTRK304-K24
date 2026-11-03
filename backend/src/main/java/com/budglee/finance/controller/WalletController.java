package com.budglee.finance.controller;

import com.budglee.finance.dto.ApiResponse;
import com.budglee.finance.dto.WalletRequest;
import com.budglee.finance.entity.Wallet;
import com.budglee.finance.security.UserPrincipal;
import com.budglee.finance.service.WalletService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
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
}
