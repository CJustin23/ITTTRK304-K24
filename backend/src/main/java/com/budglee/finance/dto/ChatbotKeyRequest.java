package com.budglee.finance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChatbotKeyRequest {
    @NotBlank @Size(max = 80)
    private String provider;
    @NotBlank @Size(max = 4096)
    private String key;
}
