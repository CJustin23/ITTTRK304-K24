package com.budglee.finance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DUAN-40 — tạo nhóm hộ. V4 khai family_groups.id là mã do người quản trị đặt (VARCHAR, không
 * tự sinh) và users.family_group_id bị khoá ngoại vào nó, nên mã này phải được tạo trước khi
 * ai đó đăng ký hoặc được gán vào nhóm.
 */
@Data
public class FamilyGroupCreateRequest {

    @NotBlank(message = "Mã nhóm hộ không được để trống")
    @Size(max = 50, message = "Mã nhóm hộ tối đa 50 ký tự")
    private String id;

    @NotBlank(message = "Tên nhóm hộ không được để trống")
    @Size(max = 100, message = "Tên nhóm hộ tối đa 100 ký tự")
    private String name;

    @NotNull(message = "Phải chỉ định chủ hộ")
    private Long ownerId;
}
