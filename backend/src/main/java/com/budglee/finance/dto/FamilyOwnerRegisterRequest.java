package com.budglee.finance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class FamilyOwnerRegisterRequest extends RegisterRequest {
    @NotBlank(message = "Tên nhóm hộ không được để trống")
    @Size(min = 2, max = 100, message = "Tên nhóm hộ phải từ 2 đến 100 ký tự")
    private String familyName;
}
