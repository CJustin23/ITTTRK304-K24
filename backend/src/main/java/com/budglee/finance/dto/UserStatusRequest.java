package com.budglee.finance.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UserStatusRequest {

    /** false = tắt tài khoản (V13): không đăng nhập được và token còn hạn cũng bị từ chối. */
    @NotNull(message = "Trạng thái hoạt động không được để trống")
    private Boolean enabled;
}
