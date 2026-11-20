package com.budglee.finance.dto;

import com.budglee.finance.entity.ChatbotApiKey;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data @AllArgsConstructor
public class ChatbotKeyResponse {
    private Long id;
    private String provider;
    private String maskedKey;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ChatbotKeyResponse from(ChatbotApiKey key) {
        return new ChatbotKeyResponse(key.getId(), key.getProvider(), key.getKeyMasked(),
                Boolean.TRUE.equals(key.getActive()), key.getCreatedAt(), key.getUpdatedAt());
    }
}
