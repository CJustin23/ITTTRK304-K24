package com.budglee.finance.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiChatResponse {
    private String conversationId;
    private String role;
    private String content;
    private boolean awaitingConfirmation;
    private ToolConfirmationDto confirmation;
    private List<Map<String, Object>> toolCalls;
    private Long timestamp;
}

