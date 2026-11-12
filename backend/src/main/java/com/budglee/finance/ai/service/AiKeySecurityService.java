package com.budglee.finance.ai.service;

import com.budglee.finance.ai.dto.AiKeySaveRequest;
import com.budglee.finance.ai.dto.AiKeyStatusResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Quản lý khóa API cá nhân (BYOK) với thuật toán mã hóa đối xứng AES-256-GCM.
 * Khóa bí mật lấy từ cấu hình bảo mật dự án (app.admin.chatbot-encryption-secret).
 */
@Service
@Slf4j
public class AiKeySecurityService {

    @Value("${app.admin.chatbot-encryption-secret:budglee-default-encryption-secret-2026-key}")
    private String encryptionSecret = "budglee-default-encryption-secret-2026-key";

    public AiKeySecurityService() {}

    public AiKeySecurityService(String encryptionSecret) {
        this.encryptionSecret = encryptionSecret;
    }

    // Bộ nhớ lưu khóa đã mã hóa theo userId (nếu đã đăng nhập) hoặc sessionId (nếu là khách)
    private final Map<String, EncryptedKeyRecord> keyStore = new ConcurrentHashMap<>();

    public record EncryptedKeyRecord(String provider, String ciphertext, String masked, String modelName) {}

    /**
     * Kiểm tra tính hợp lệ sơ bộ của API key theo định dạng nhà cung cấp.
     */
    public boolean validateKeyFormat(String provider, String key) {
        if (key == null || key.isBlank() || key.length() < 15) {
            return false;
        }
        if ("GEMINI".equalsIgnoreCase(provider)) {
            // Khóa Google AI Studio thường bắt đầu bằng AIzaSy và có độ dài khoảng 39 ký tự
            return key.startsWith("AIzaSy") || key.length() >= 30;
        } else if ("OPENAI".equalsIgnoreCase(provider)) {
            // Khóa OpenAI thường bắt đầu bằng sk-
            return key.startsWith("sk-") || key.length() >= 30;
        }
        return true;
    }

    /**
     * Che dấu khóa (masking) để hiển thị an toàn trên giao diện Frontend: AIzaSy••••••••8x1Z
     */
    public String maskKey(String rawKey) {
        if (rawKey == null || rawKey.length() <= 8) {
            return "••••••••";
        }
        int prefixLen = Math.min(6, rawKey.length() / 4);
        int suffixLen = Math.min(4, rawKey.length() / 4);
        return rawKey.substring(0, prefixLen) + "••••••••" + rawKey.substring(rawKey.length() - suffixLen);
    }

    /**
     * Lưu API Key được mã hóa AES-256-GCM.
     */
    public AiKeyStatusResponse saveKey(Long userId, AiKeySaveRequest request) {
        String lookupKey = buildLookupKey(userId, request.getSessionId());
        String provider = request.getProvider().toUpperCase();
        String rawKey = request.getApiKey().trim();

        if (!validateKeyFormat(provider, rawKey)) {
            throw new IllegalArgumentException("Định dạng API Key của " + provider + " không hợp lệ. Vui lòng kiểm tra lại!");
        }

        String ciphertext = encrypt(rawKey);
        String masked = maskKey(rawKey);
        String modelName = request.getModelName() != null && !request.getModelName().isBlank()
                ? request.getModelName().trim()
                : ("OPENAI".equals(provider) ? "gpt-4o-mini" : "gemini-1.5-flash");

        keyStore.put(lookupKey, new EncryptedKeyRecord(provider, ciphertext, masked, modelName));
        log.info("Đã mã hóa và lưu thành công BYOK cho entity='{}' provider='{}'", lookupKey, provider);

        return AiKeyStatusResponse.builder()
                .hasKey(true)
                .provider(provider)
                .maskedKey(masked)
                .modelName(modelName)
                .build();
    }

    /**
     * Lấy trạng thái khóa (chỉ trả về bản masked, tuyệt đối không trả raw key).
     */
    public AiKeyStatusResponse getKeyStatus(Long userId, String sessionId) {
        String lookupKey = buildLookupKey(userId, sessionId);
        EncryptedKeyRecord record = keyStore.get(lookupKey);
        if (record == null) {
            return AiKeyStatusResponse.builder().hasKey(false).build();
        }
        return AiKeyStatusResponse.builder()
                .hasKey(true)
                .provider(record.provider())
                .maskedKey(record.masked())
                .modelName(record.modelName())
                .build();
    }

    /**
     * Lấy API Key thô (đã giải mã) trong bộ nhớ phục vụ request LLM hiện tại.
     */
    public String resolveRawApiKey(Long userId, String sessionId, String directKey) {
        if (directKey != null && !directKey.isBlank()) {
            return directKey.trim();
        }
        String lookupKey = buildLookupKey(userId, sessionId);
        EncryptedKeyRecord record = keyStore.get(lookupKey);
        if (record != null) {
            return decrypt(record.ciphertext());
        }
        return null;
    }

    /**
     * Lấy thông tin Provider và Model của người dùng.
     */
    public EncryptedKeyRecord getKeyRecord(Long userId, String sessionId) {
        return keyStore.get(buildLookupKey(userId, sessionId));
    }

    /**
     * Xóa API Key cá nhân.
     */
    public void deleteKey(Long userId, String sessionId) {
        keyStore.remove(buildLookupKey(userId, sessionId));
    }

    private String buildLookupKey(Long userId, String sessionId) {
        if (userId != null) {
            return "user_" + userId;
        }
        return "session_" + (sessionId != null ? sessionId.trim() : "anonymous");
    }

    // =========================================================================
    // Thuật toán Mã hóa đối xứng AES-256-GCM với IV ngẫu nhiên 12 bytes
    // =========================================================================

    private SecretKeySpec aesKey() {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(encryptionSecret.getBytes(StandardCharsets.UTF_8));
            return new SecretKeySpec(digest, "AES");
        } catch (Exception ex) {
            throw new IllegalStateException("Không thể khởi tạo khóa bí mật AES-256", ex);
        }
    }

    String encrypt(String plainText) {
        try {
            byte[] iv = new byte[12];
            new SecureRandom().nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, aesKey(), new GCMParameterSpec(128, iv));
            byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            byte[] output = new byte[iv.length + encrypted.length];
            System.arraycopy(iv, 0, output, 0, iv.length);
            System.arraycopy(encrypted, 0, output, iv.length, encrypted.length);
            return Base64.getEncoder().encodeToString(output);
        } catch (Exception ex) {
            throw new IllegalStateException("Lỗi trong quá trình mã hóa AES-256-GCM", ex);
        }
    }

    String decrypt(String ciphertext) {
        try {
            byte[] input = Base64.getDecoder().decode(ciphertext);
            byte[] iv = java.util.Arrays.copyOfRange(input, 0, 12);
            byte[] encrypted = java.util.Arrays.copyOfRange(input, 12, input.length);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, aesKey(), new GCMParameterSpec(128, iv));
            return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
        } catch (Exception ex) {
            throw new IllegalStateException("Lỗi giải mã API Key: khóa bí mật không khớp hoặc ciphertext bị lỗi", ex);
        }
    }
}

