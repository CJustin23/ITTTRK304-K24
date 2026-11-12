package com.budglee.finance;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * DUAN-39 — cửa /auth/login trước đây không chặn gì: script dò mật khẩu chạy vô hạn, và token đã
 * cấp thì sống đúng 24 giờ kể cả khi người dùng bấm "đăng xuất" hay bị đánh cắp.
 *
 * Chạy với hồ sơ test nhưng bật lại LoginAttemptService — hồ sơ test mặc định tắt nó vì bộ đếm
 * theo IP sẽ dùng chung một 127.0.0.1 cho cả test suite.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = "app.security.login-lockout.enabled=true")
class LoginRateLimitAndLogoutTest {

    private static final String PASSWORD = "MatKhau123";
    private static final AtomicInteger IP_SEQUENCE = new AtomicInteger();

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper om;

    private JsonNode json(MvcResult result) throws Exception {
        return om.readTree(new String(result.getResponse().getContentAsByteArray(), StandardCharsets.UTF_8));
    }

    private String register(String email) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("fullName", "Người dùng rate limit");
        body.put("email", email);
        body.put("password", PASSWORD);
        mvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(body))).andReturn();
        return email;
    }

    private MvcResult attempt(String email, String password, String clientIp) throws Exception {
        return mvc.perform(post("/api/v1/auth/login")
                .header("X-Forwarded-For", clientIp)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("email", email, "password", password)))).andReturn();
    }

    private String loginAndGetToken(String email, String clientIp) throws Exception {
        return json(attempt(email, PASSWORD, clientIp)).at("/data/token").asText();
    }

    private String newIp() {
        int sequence = IP_SEQUENCE.incrementAndGet();
        return "10.9." + (sequence / 250) + "." + (sequence % 250);
    }

    @Test
    void bruteForceIsBlockedAfterTenWrongGuesses() throws Exception {
        String email = register("rl." + UUID.randomUUID() + "@gmail.com");
        String ip = newIp();

        for (int attempt = 1; attempt <= 10; attempt++) {
            assertThat(attempt(email, "SaiMatKhau" + attempt, ip).getResponse().getStatus())
                    .as("lần sai thứ %d vẫn phải trả lời như bình thường", attempt)
                    .isEqualTo(401);
        }

        assertThat(attempt(email, "SaiMatKhau11", ip).getResponse().getStatus())
                .as("lần thứ 11 phải bị chặn, không phải 401")
                .isEqualTo(429);
        assertThat(attempt(email, PASSWORD, ip).getResponse().getStatus())
                .as("đúng mật khẩu cũng không mở được cửa khi đã khoá")
                .isEqualTo(429);
    }

    @Test
    void oneNoisyIpLocksOutEveryAccountItHammers() throws Exception {
        String attacker = newIp();
        String first = register("rl." + UUID.randomUUID() + "@gmail.com");
        String second = register("rl." + UUID.randomUUID() + "@gmail.com");
        for (int attempt = 0; attempt < 10; attempt++) {
            assertThat(attempt(first, "Sai" + attempt, attacker).getResponse().getStatus()).isEqualTo(401);
        }

        assertThat(attempt(second, PASSWORD, attacker).getResponse().getStatus())
                .as("một IP đã vượt ngưỡng thì đổi sang tài khoản khác vẫn bị chặn — đó là lý do đếm theo IP")
                .isEqualTo(429);
        assertThat(attempt(second, PASSWORD, newIp()).getResponse().getStatus())
                .as("chặn chỉ đánh vào IP gây chuyện, không phạt người dùng thật ở chỗ khác")
                .isEqualTo(200);
    }

    @Test
    void aSuccessfulLoginClearsTheCounter() throws Exception {
        String email = register("rl." + UUID.randomUUID() + "@gmail.com");
        String ip = newIp();
        for (int attempt = 0; attempt < 9; attempt++) {
            assertThat(attempt(email, "Sai" + attempt, ip).getResponse().getStatus()).isEqualTo(401);
        }

        assertThat(loginAndGetToken(email, ip)).startsWith("eyJ");

        // Bộ đếm đã về 0 nên chín lần sai kế tiếp vẫn chưa chạm ngưỡng.
        for (int attempt = 0; attempt < 9; attempt++) {
            assertThat(attempt(email, "Lai" + attempt, ip).getResponse().getStatus()).isEqualTo(401);
        }
        assertThat(attempt(email, PASSWORD, ip).getResponse().getStatus()).isEqualTo(200);
    }

    @Test
    void logoutKillsTheTokenThatIsStillInsideItsValidity() throws Exception {
        String email = register("logout." + UUID.randomUUID() + "@gmail.com");
        String other = register("logout." + UUID.randomUUID() + "@gmail.com");
        String ip = newIp();
        String token = loginAndGetToken(email, ip);
        String otherToken = loginAndGetToken(other, ip);

        assertThat(mvc.perform(get("/api/v1/transactions")
                .header("Authorization", "Bearer " + token)).andReturn().getResponse().getStatus()).isEqualTo(200);

        MvcResult logout = mvc.perform(post("/api/v1/auth/logout")
                .header("Authorization", "Bearer " + token)).andReturn();

        assertThat(logout.getResponse().getStatus()).isEqualTo(200);
        assertThat(json(logout).at("/success").asBoolean()).isTrue();
        assertThat(mvc.perform(get("/api/v1/transactions")
                .header("Authorization", "Bearer " + token)).andReturn().getResponse().getStatus())
                .as("token HS256 vẫn còn chữ ký hợp lệ, chỉ blocklist mới làm nó chết")
                .isEqualTo(401);
        assertThat(mvc.perform(get("/api/v1/wallets")
                .header("Authorization", "Bearer " + otherToken)).andReturn().getResponse().getStatus())
                .as("thu hồi một token không được vơ cả token của người khác")
                .isEqualTo(200);
    }

    @Test
    void logoutWithTheSameTokenTwiceStillLeavesItDead() throws Exception {
        String email = register("logout." + UUID.randomUUID() + "@gmail.com");
        String token = loginAndGetToken(email, newIp());

        mvc.perform(post("/api/v1/auth/logout").header("Authorization", "Bearer " + token)).andReturn();

        assertThat(mvc.perform(post("/api/v1/auth/logout")
                .header("Authorization", "Bearer " + token)).andReturn().getResponse().getStatus()).isEqualTo(200);
        assertThat(mvc.perform(get("/api/v1/transactions")
                .header("Authorization", "Bearer " + token)).andReturn().getResponse().getStatus()).isEqualTo(401);
    }

    @Test
    void logoutWithoutABearerTokenIsRejected() throws Exception {
        assertThat(mvc.perform(post("/api/v1/auth/logout")).andReturn().getResponse().getStatus())
                .isEqualTo(400);
    }

    @Test
    void loggingInAgainAfterLogoutGivesAFreshUsableToken() throws Exception {
        String email = register("logout." + UUID.randomUUID() + "@gmail.com");
        String ip = newIp();
        String dead = loginAndGetToken(email, ip);
        mvc.perform(post("/api/v1/auth/logout").header("Authorization", "Bearer " + dead)).andReturn();

        String fresh = loginAndGetToken(email, ip);

        assertThat(fresh).isNotEqualTo(dead);
        assertThat(mvc.perform(get("/api/v1/transactions")
                .header("Authorization", "Bearer " + fresh)).andReturn().getResponse().getStatus()).isEqualTo(200);
    }
}
