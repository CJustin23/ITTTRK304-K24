package com.budglee.finance;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Gọi qua HTTP thật (không qua MockMvc) vì servlet container mới là nơi mã lỗi hay bị đổi:
 * response.sendError(...) kích hoạt error-dispatch, và bộ lọc bảo mật có thể nuốt 409 thành 401.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class ErrorCodeOverRealHttpTest {

    @Autowired
    private TestRestTemplate rest;

    private ResponseEntity<String> register(String email, String password) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return rest.exchange("/api/v1/auth/register", HttpMethod.POST, new HttpEntity<>(Map.of(
                "fullName", "Người kiểm thử",
                "email", email,
                "password", password,
                "role", "INDIVIDUAL_USER"), headers), String.class);
    }

    @Test
    void duplicateEmailKeepsConflictAndUsesApiEnvelope() {
        String email = "realhttp." + UUID.randomUUID() + "@budglee.dev";
        assertThat(register(email, "MatKhau123").getStatusCode()).isEqualTo(HttpStatus.OK);

        ResponseEntity<String> second = register(email, "MatKhau456");

        assertThat(second.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(second.getBody())
                .contains("\"success\":false")
                .contains("Email đã được đăng ký");
    }

    @Test
    void privilegedRoleIsRejectedWithEnvelopeNotDefaultErrorPage() {
        ResponseEntity<String> response = register("realhttp." + UUID.randomUUID() + "@budglee.dev", "MatKhau123",
                "SYSTEM_ADMIN");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody())
                .contains("\"success\":false")
                .doesNotContain("\"path\"");
    }

    private ResponseEntity<String> register(String email, String password, String role) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return rest.exchange("/api/v1/auth/register", HttpMethod.POST, new HttpEntity<>(Map.of(
                "fullName", "Người kiểm thử",
                "email", email,
                "password", password,
                "role", role), headers), String.class);
    }
}
