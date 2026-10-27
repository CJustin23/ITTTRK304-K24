package com.budglee.finance.controller;

import com.budglee.finance.dto.ApiResponse;
import com.budglee.finance.entity.Wallet;
import com.budglee.finance.repository.WalletRepository;
import com.budglee.finance.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/wallets")
@RequiredArgsConstructor
@Tag(name = "Wallets", description = "Quản lý Ví tiền & Thẻ ngân hàng")
public class WalletController {

    private final WalletRepository walletRepository;

    @GetMapping
    @Operation(summary = "Lấy danh sách ví của người dùng hiện tại")
    public ResponseEntity<ApiResponse<List<Wallet>>> getWallets(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<Wallet> wallets = walletRepository.findByUserId(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok(wallets, "Lấy danh sách ví thành công"));
    }

    @PostMapping
    @Operation(summary = "Tạo ví / thẻ mới")
    public ResponseEntity<ApiResponse<Wallet>> createWallet(@AuthenticationPrincipal UserPrincipal currentUser,
                                                            @RequestBody Wallet wallet) {
        // Gán user hiện tại vào ví
        com.budglee.finance.entity.User user = new com.budglee.finance.entity.User();
        user.setId(currentUser.getId());
        wallet.setUser(user);
        Wallet saved = walletRepository.save(wallet);
        return ResponseEntity.ok(ApiResponse.ok(saved, "Tạo ví thành công"));
    }
}
