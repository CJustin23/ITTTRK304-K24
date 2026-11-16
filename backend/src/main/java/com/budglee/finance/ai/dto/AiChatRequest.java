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
public class AiChatRequest {
    @NotBlank(message = "Session ID không được để trống")
    private String sessionId;

    @NotBlank(message = "Nội dung câu hỏi không được để trống")
    private String message;

    private String conversationId;
    private String provider; // 'GEMINI' hoặc 'OPENAI'
    private String apiKey;   // Optional BYOK passed directly
}

