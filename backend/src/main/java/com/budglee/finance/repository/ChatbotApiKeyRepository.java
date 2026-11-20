package com.budglee.finance.repository;

import com.budglee.finance.entity.ChatbotApiKey;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatbotApiKeyRepository extends JpaRepository<ChatbotApiKey, Long> {
}
