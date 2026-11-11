package com.budglee.finance.service;

import com.budglee.finance.dto.ChatbotKeyRequest;
import com.budglee.finance.dto.ChatbotKeyResponse;
import com.budglee.finance.entity.ChatbotApiKey;
import com.budglee.finance.repository.ChatbotApiKeyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;

@Service @RequiredArgsConstructor @Slf4j
public class ChatbotKeyService {
    private final ChatbotApiKeyRepository repository;
    @Value("${app.admin.chatbot-encryption-secret}")
    private String encryptionSecret;

    @Transactional(readOnly = true)
    public List<ChatbotKeyResponse> list() {
        return repository.findAll().stream().map(ChatbotKeyResponse::from).toList();
    }

    @Transactional
    public ChatbotKeyResponse create(ChatbotKeyRequest request) {
        ChatbotApiKey key = ChatbotApiKey.builder()
                .provider(request.getProvider().trim())
                .keyCiphertext(encrypt(request.getKey().trim()))
                .keyMasked(mask(request.getKey().trim()))
                .active(false)
                .build();
        return ChatbotKeyResponse.from(repository.save(key));
    }

    @Transactional
    public ChatbotKeyResponse update(long id, ChatbotKeyRequest request) {
        ChatbotApiKey target = get(id);
        target.setProvider(request.getProvider().trim());
        target.setKeyCiphertext(encrypt(request.getKey().trim()));
        target.setKeyMasked(mask(request.getKey().trim()));
        return ChatbotKeyResponse.from(repository.save(target));
    }

    @Transactional
    public ChatbotKeyResponse toggle(long id, boolean active) {
        ChatbotApiKey target = get(id);
        if (active) repository.findAll().stream().filter(other -> !other.getId().equals(id))
                .forEach(other -> other.setActive(false));
        target.setActive(active);
        return ChatbotKeyResponse.from(repository.save(target));
    }

    @Transactional
    public void delete(long id) {
        repository.delete(get(id));
    }

    @Transactional(readOnly = true)
    public String reveal(long id, long actorId) {
        ChatbotApiKey key = get(id);
        log.info("Quản trị viên id={} yêu cầu xem API key chatbot id={} provider={}", actorId, id, key.getProvider());
        return decrypt(key.getKeyCiphertext());
    }

    private ChatbotApiKey get(long id) {
        return repository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy API key chatbot"));
    }

    private String mask(String key) {
        if (key.length() <= 6) return "••••••";
        return key.substring(0, 3) + "••••••••" + key.substring(key.length() - 4);
    }

    private SecretKeySpec aesKey() {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(encryptionSecret.getBytes(StandardCharsets.UTF_8));
            return new SecretKeySpec(digest, "AES");
        } catch (Exception exception) {
            throw new IllegalStateException("Không thể khởi tạo khóa mã hóa chatbot", exception);
        }
    }

    private String encrypt(String plainText) {
        try {
            byte[] iv = new byte[12]; new SecureRandom().nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, aesKey(), new GCMParameterSpec(128, iv));
            byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            byte[] output = new byte[iv.length + encrypted.length];
            System.arraycopy(iv, 0, output, 0, iv.length);
            System.arraycopy(encrypted, 0, output, iv.length, encrypted.length);
            return Base64.getEncoder().encodeToString(output);
        } catch (Exception exception) {
            throw new IllegalStateException("Không thể mã hóa API key chatbot", exception);
        }
    }

    private String decrypt(String ciphertext) {
        try {
            byte[] input = Base64.getDecoder().decode(ciphertext);
            byte[] iv = java.util.Arrays.copyOfRange(input, 0, 12);
            byte[] encrypted = java.util.Arrays.copyOfRange(input, 12, input.length);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, aesKey(), new GCMParameterSpec(128, iv));
            return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
        } catch (Exception exception) {
            throw new IllegalStateException("Không thể giải mã API key chatbot; kiểm tra CHATBOT_KEY_ENCRYPTION_SECRET", exception);
        }
    }
}
