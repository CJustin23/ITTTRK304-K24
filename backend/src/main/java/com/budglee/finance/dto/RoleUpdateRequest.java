package com.budglee.finance.dto;

import com.budglee.finance.entity.Role;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RoleUpdateRequest {

    @NotNull(message = "Vai trò không được để trống")
    private Role role;

    private String familyGroupId;
}
