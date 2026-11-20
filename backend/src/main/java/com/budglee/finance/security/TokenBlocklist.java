package com.budglee.finance.security;

import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * =========================================================================
 * COMPONENT: DANH SÁCH TOKEN ĐÃ THU HỒI (POST-LIST)
 * Phụ trách: Nguyễn Trường An (Backend Lead) — nhánh 'an'
 *
 * Quy tắc:
 * 1. JWT ký HS256 không có trạng thái, nên "đăng xuất" chỉ có nghĩa là ghi token vào đây cho tới
 *    khi đúng lúc nó hết hạn tự nhiên — hết hạn rồi thì không cần nhớ nữa, bản ghi bị xoá.
 * 2. Khoá tra cứu là SHA-256 của token, không phải token gốc: log hay thread dump không lộ
 *    credential còn dùng được.
 * 3. Trạng thái nằm trong JVM. Một instance thì đủ cho demo và cho VPS hiện tại (một backend
 *    container); nếu scale nhiều instance phải chuyển sang Redis, khi đó mọi instance cùng thấy
 *    một lần đăng xuất.
 * =========================================================================
 */
@Component
public class TokenBlocklist {

    private final Map<String, Instant> revokedTokens = new ConcurrentHashMap<>();

    /** Token đã chết với người dùng, nhưng vẫn còn hạn với chữ ký: nhớ tới đúng lúc đó. */
    public void block(String token, long remainingValidityMs) {
        if (token == null || token.isBlank() || remainingValidityMs <= 0) {
            return;
        }
        purgeExpired();
        revokedTokens.put(fingerprint(token), Instant.now().plusMillis(remainingValidityMs));
    }

    public boolean isBlocked(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        String key = fingerprint(token);
        Instant expiry = revokedTokens.get(key);
        if (expiry == null) {
            return false;
        }
        if (expiry.isBefore(Instant.now())) {
            revokedTokens.remove(key, expiry);
            return false;
        }
        return true;
    }

    public int size() {
        purgeExpired();
        return revokedTokens.size();
    }

    private void purgeExpired() {
        Instant now = Instant.now();
        revokedTokens.values().removeIf(expiry -> expiry.isBefore(now));
    }

    private static String fingerprint(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                hex.append(Character.forDigit((b >> 4) & 0xF, 16)).append(Character.forDigit(b & 0xF, 16));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 phải có mặt trên mọi JVM", exception);
        }
    }
}
