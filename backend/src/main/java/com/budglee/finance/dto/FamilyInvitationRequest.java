package com.budglee.finance.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FamilyInvitationRequest {
    @NotBlank(message = "Email người được mời không được để trống")
    @Email(message = "Email người được mời không hợp lệ")
    private String email;
}
