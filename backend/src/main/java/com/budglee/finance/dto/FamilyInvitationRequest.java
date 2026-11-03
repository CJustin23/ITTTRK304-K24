package com.budglee.finance.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FamilyInvitationRequest {
    @NotBlank(message = "Email người được mời không được để trống")
    @Email(message = "Email người được mời không hợp lệ")
    private String email;
}
