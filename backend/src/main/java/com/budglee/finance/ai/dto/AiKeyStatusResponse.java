package com.budglee.finance.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiKeyStatusResponse {
    private boolean hasKey;
    private String provider;
    private String maskedKey;
    private String modelName;
}

