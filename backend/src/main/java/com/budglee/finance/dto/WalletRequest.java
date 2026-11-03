package com.budglee.finance.dto;

import com.budglee.finance.entity.WalletType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

/**
 * DUAN-48 — chỉ nhận đúng những gì người dùng được khai khi tạo ví.
 * Không dùng entity Wallet làm body: ai gửi kèm "id" thì repository.save(...) sẽ cập nhật
 * ví của người khác thay vì tạo mới.
 */
@Data
public class WalletRequest {

    @NotNull(message = "Tên ví không được để trống")
    @Size(max = 100, message = "Tên ví tối đa 100 ký tự")
    private String walletName;

    @NotNull(message = "Loại ví không được để trống")
    private WalletType type;

    @Size(max = 10, message = "Mã tiền tệ tối đa 10 ký tự")
    private String currency;

    @DecimalMin(value = "0", message = "Số dư khởi tạo không được âm")
    private BigDecimal balance;

    @Size(max = 20, message = "Số thẻ che tối đa 20 ký tự")
    private String cardNumberMasked;
}
