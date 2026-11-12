package com.budglee.finance.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiKeySaveRequest {
    @NotBlank(message = "Session ID không được để trống")
    private String sessionId;

    @NotBlank(message = "Nhà cung cấp (Provider) không được để trống")
    private String provider; // 'GEMINI' hoặc 'OPENAI'

    @NotBlank(message = "API Key không được để trống")
    private String apiKey;

    private String modelName;
}

