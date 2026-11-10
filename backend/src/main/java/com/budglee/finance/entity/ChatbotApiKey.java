package com.budglee.finance.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "chatbot_api_keys", indexes = {
        @Index(name = "idx_chatbot_api_keys_active", columnList = "active")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChatbotApiKey {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String provider;

    @Column(name = "key_ciphertext", nullable = false, columnDefinition = "TEXT")
    private String keyCiphertext;

    @Column(name = "key_masked", nullable = false, length = 120)
    private String keyMasked;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
