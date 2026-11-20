package com.budglee.finance.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * =========================================================================
 * COMPONENT: CHONG DO MAT KHAU (LOGIN RATE LIMIT)
 * Phụ trách: Nguyễn Trường An (Backend Lead) — nhánh 'an'
 *
 * Quy tắc:
 * 1. Đếm theo CẢ email lẫn IP, chặn khi một trong hai vượt ngưỡng. Chỉ đếm email thì kẻ tấn công
 *    đổi IP là thoát; chỉ đếm IP thì một IP botnet khoá trắng tài khoản của người khác.
 * 2. Ngưỡng 10 lần sai trong 15 phút, tính trên cửa sổ trượt: sau 15 phút không sai nữa thì
 *    người dùng bình thường được tiếp lại mà không cần admin can thiệp.
 * 3. Đăng nhập đúng thì xoá cả hai bộ đếm, nên một lần thành công "mở khoá" cho phiên sau đó.
 * 4. Chỉ ghi nhận thất bại — thành công không được cộng vào bộ đếm IP, nếu không một văn phòng
 *    dùng chung NAT sẽ tự khoá mình sau vài chục lần nhân viên đăng nhập.
 * 5. Trạng thái nằm trong JVM, giống TokenBlocklist: đủ cho một backend container, nhiều
 *    instance thì phải chuyển sang Redis.
 * =========================================================================
 */
@Component
@Slf4j
public class LoginAttemptService {

    public static final int MAX_FAILED_ATTEMPTS = 10;
    public static final long WINDOW_MS = 15 * 60 * 1000L;

    private final Map<String, Counter> counters = new ConcurrentHashMap<>();

    @Value("${app.security.login-lockout.enabled:true}")
    private boolean enabled = true;

    /** Ném 429 trước khi thử mật khẩu, để không dò nổi tốc độ trả lời. */
    public void rejectIfBlocked(String email, String clientIp) {
        if (!enabled) {
            return;
        }
        String emailKey = emailKey(email);
        String ipKey = ipKey(clientIp);
        if (isOverLimit(emailKey) || isOverLimit(ipKey)) {
            log.warn("Khoá đăng nhập tạm thời email={} ip={}", email, clientIp);
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Nhập sai quá nhiều lần, tài khoản bị tạm khoá 15 phút");
        }
    }

    public void recordFailure(String email, String clientIp) {
        if (!enabled) {
            return;
        }
        bump(emailKey(email));
        bump(ipKey(clientIp));
    }

    public void reset(String email, String clientIp) {
        counters.remove(emailKey(email));
        counters.remove(ipKey(clientIp));
    }

    private boolean isOverLimit(String key) {
        Counter counter = counters.get(key);
        if (counter == null) {
            return false;
        }
        if (counter.isStale()) {
            counters.remove(key, counter);
            return false;
        }
        return counter.failures.get() >= MAX_FAILED_ATTEMPTS;
    }

    private void bump(String key) {
        Counter counter = counters.compute(key, (ignored, existing) ->
                existing == null || existing.isStale() ? new Counter() : existing);
        counter.failures.incrementAndGet();
    }

    /** Không có bộ lọc nào chạy trước /auth/login, nên chỉ lấy được IP từ chính request. */
    public static String emailKey(String email) {
        return "email:" + email.toLowerCase();
    }

    public static String ipKey(String clientIp) {
        return "ip:" + (clientIp == null || clientIp.isBlank() ? "unknown" : clientIp);
    }

    private static final class Counter {
        private final AtomicInteger failures = new AtomicInteger();
        private final Instant startedAt = Instant.now();

        boolean isStale() {
            return startedAt.plusMillis(WINDOW_MS).isBefore(Instant.now());
        }
    }
}
