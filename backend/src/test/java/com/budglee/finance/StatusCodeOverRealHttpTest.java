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
 * Chạy qua HTTP thật (không qua MockMvc) để bắt các lỗi chỉ xuất hiện khi servlet container
 * chuyển tiếp lỗi, ví dụ ResponseStatusException bị bộ lọc bảo mật nuốt thành 401.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class StatusCodeOverRealHttpTest {

    @Autowired
    private TestRestTemplate rest;

    private ResponseEntity<String> postJson(String path, String token, Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (token != null) {
            headers.setBearerAuth(token);
        }
        return rest.exchange(path, HttpMethod.POST, new HttpEntity<>(body, headers), String.class);
    }

    private String registerUser() {
        ResponseEntity<String> response = postJson("/api/v1/auth/register", null, Map.of(
                "fullName", "Người kiểm thử",
                "email", "status." + UUID.randomUUID() + "@budglee.dev",
                "password", "MatKhau123",
                "role", "INDIVIDUAL_USER"));
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return response.getBody().replaceAll("(?s).*\"token\":\"([^\"]+)\".*", "$1");
    }

    @Test
    void duplicateEmailStaysConflictOverRealHttp() {
        String email = "status." + UUID.randomUUID() + "@budglee.dev";
        Map<String, Object> payload = Map.of(
                "fullName", "Người kiểm thử",
                "email", email,
                "password", "MatKhau123",
                "role", "INDIVIDUAL_USER");

        assertThat(postJson("/api/v1/auth/register", null, payload).getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(postJson("/api/v1/auth/register", null, payload).getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void unknownWalletStaysNotFound() {
        String token = registerUser();

        ResponseEntity<String> response = postJson("/api/v1/transactions", token, Map.of(
                "walletId", 987654,
                "actionTitle", "Ví không tồn tại",
                "amount", "1000",
                "transactionType", "EXPENSE"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void anonymousCallIsUnauthorizedNotForbidden() {
        ResponseEntity<String> response = rest.exchange(
                "/api/v1/wallets", HttpMethod.GET, HttpEntity.EMPTY, String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void transferReportsNotImplemented() {
        String token = registerUser();
        ResponseEntity<String> wallet = postJson("/api/v1/wallets", token, Map.of(
                "walletName", "Ví chuyển khoản",
                "type", "CASH",
                "currency", "VND",
                "balance", "100000"));
        long walletId = Long.parseLong(wallet.getBody().replaceAll("(?s).*\"data\":\\{\"id\":(\\d+).*", "$1"));

        ResponseEntity<String> response = postJson("/api/v1/transactions", token, Map.of(
                "walletId", walletId,
                "actionTitle", "Chuyển ví",
                "amount", "1000",
                "transactionType", "TRANSFER"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_IMPLEMENTED);
    }
}
