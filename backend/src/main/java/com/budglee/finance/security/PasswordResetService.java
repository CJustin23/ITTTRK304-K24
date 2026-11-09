package com.budglee.finance.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * =========================================================================
 * SERVICE: QUẢN LÝ MÃ XÁC THỰC QUÊN MẬT KHẨU (PASSWORD RESET OTP)
 *
 * Quy tắc:
 * 1. Mã xác thực gồm đúng 6 chữ số ngẫu nhiên (Numeric OTP, 0-9) để người dùng dễ thao tác.
 * 2. Thời hạn hiệu lực: 10 phút kể từ lúc sinh mã.
 * 3. Chống đoán mã (Brute-force): Mỗi mã chỉ được nhập sai tối đa 5 lần; quá 5 lần mã bị huỷ.
 * 4. Dùng một lần duy nhất (One-time use): Sau khi đổi mật khẩu thành công, mã lập tức bị xoá.
 * =========================================================================
 */
@Service
@Slf4j
public class PasswordResetService {

    public static final int OTP_LENGTH = 6;
    public static final Duration OTP_VALIDITY = Duration.ofMinutes(10);
    public static final int MAX_FAILED_ATTEMPTS = 5;

    private static final String DIGITS = "0123456789";

    private final SecureRandom secureRandom = new SecureRandom();
    private final Map<String, ResetCodeEntry> activeCodes = new ConcurrentHashMap<>();

    private static class ResetCodeEntry {
        final String otp;
        final Instant expiresAt;
        final AtomicInteger failedAttempts = new AtomicInteger(0);

        ResetCodeEntry(String otp, Instant expiresAt) {
            this.otp = otp;
            this.expiresAt = expiresAt;
        }

        boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }

    /**
     * Sinh mã xác thực 6 chữ số (numeric OTP), lưu vào bộ nhớ có TTL.
     */
    public String generateAndSaveCode(String email) {
        purgeExpired();
        String normalizedEmail = normalizeEmail(email);

        String otp = generateNumericOtp();
        Instant expiresAt = Instant.now().plus(OTP_VALIDITY);

        activeCodes.put(normalizedEmail, new ResetCodeEntry(otp, expiresAt));
        log.info("Đã tạo mã xác thực quên mật khẩu (6 chữ số) cho email={} (hết hạn sau {} phút): {}",
                normalizedEmail, OTP_VALIDITY.toMinutes(), otp);
        return otp;
    }

    /**
     * Xác thực mã OTP và xoá mã ngay lập tức nếu hợp lệ (one-time use).
     */
    public void verifyAndInvalidateCode(String email, String inputOtp) {
        purgeExpired();
        String normalizedEmail = normalizeEmail(email);

        ResetCodeEntry entry = activeCodes.get(normalizedEmail);
        if (entry == null || entry.isExpired()) {
            activeCodes.remove(normalizedEmail);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Mã xác thực không tồn tại hoặc đã hết hạn. Vui lòng yêu cầu mã mới");
        }

        if (entry.failedAttempts.get() >= MAX_FAILED_ATTEMPTS) {
            activeCodes.remove(normalizedEmail);
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Bạn đã nhập sai mã xác thực quá 5 lần. Vui lòng yêu cầu mã mới");
        }

        String normalizedInput = inputOtp == null ? "" : inputOtp.trim().toUpperCase(Locale.ROOT);
        if (!entry.otp.equals(normalizedInput)) {
            int attempts = entry.failedAttempts.incrementAndGet();
            int remaining = MAX_FAILED_ATTEMPTS - attempts;
            if (remaining <= 0) {
                activeCodes.remove(normalizedEmail);
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                        "Bạn đã nhập sai mã xác thực quá 5 lần. Vui lòng yêu cầu mã mới");
            }
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Mã xác thực không chính xác. Bạn còn " + remaining + " lần thử");
        }

        // Khớp mã thành công -> Xoá mã ngay lập tức
        activeCodes.remove(normalizedEmail);
        log.info("Xác thực mã OTP thành công cho email={}", normalizedEmail);
    }

    /**
     * Huỷ mã của một email (dùng khi cần reset thủ công hoặc huỷ phiên).
     */
    public void invalidate(String email) {
        if (email != null) {
            activeCodes.remove(normalizeEmail(email));
        }
    }

    /**
     * Sinh chuỗi ngẫu nhiên đúng 6 chữ số (0-9).
     */
    public String generateNumericOtp() {
        StringBuilder sb = new StringBuilder(OTP_LENGTH);
        for (int i = 0; i < OTP_LENGTH; i++) {
            sb.append(DIGITS.charAt(secureRandom.nextInt(DIGITS.length())));
        }
        return sb.toString();
    }

    /**
     * Tương thích ngược: trả về mã OTP 6 chữ số.
     */
    public String generateAlphanumericOtp() {
        return generateNumericOtp();
    }

    private void purgeExpired() {
        Instant now = Instant.now();
        activeCodes.values().removeIf(entry -> entry.expiresAt.isBefore(now));
    }

    private static String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}

