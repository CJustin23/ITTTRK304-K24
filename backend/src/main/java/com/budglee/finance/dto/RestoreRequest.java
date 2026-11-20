package com.budglee.finance.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RestoreRequest {
    @NotBlank private String token;
    @NotBlank private String confirmation;
}
