package com.budglee.finance.dto;

import com.budglee.finance.entity.WalletType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DUAN-48 — body cho PUT /wallets/{id}.
 * Không có trường balance: số dư chỉ do giao dịch cộng/trừ, nếu nhận từ body thì người dùng
 * tự đặt số dư tuỳ ý và toàn bộ lịch sử sử dụng ví trở nên vô nghĩa.
 */
@Data
public class WalletUpdateRequest {

    @NotNull(message = "Tên ví không được để trống")
    @Size(max = 100, message = "Tên ví tối đa 100 ký tự")
    private String walletName;

    @NotNull(message = "Loại ví không được để trống")
    private WalletType type;

    @Size(max = 10, message = "Mã tiền tệ tối đa 10 ký tự")
    private String currency;

    @Size(max = 20, message = "Số thẻ che tối đa 20 ký tự")
    private String cardNumberMasked;
}
