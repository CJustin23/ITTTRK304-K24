package com.budglee.finance;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * Các chốt an toàn mặc định của DUAN-39/40 từng bị mở quá tay: CORS chấp nhận mọi origin kèm
 * credential, swagger công khai cả /actuator dù pom không có actuator, mật khẩu 6 ký tự là đủ,
 * và "size" của phân trang do client tự chọn. Mỗi test ở đây giữ đúng một chốt.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityHardeningTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper om;

    private JsonNode json(MvcResult result) throws Exception {
        return om.readTree(new String(result.getResponse().getContentAsByteArray(),
                java.nio.charset.StandardCharsets.UTF_8));
    }

    private String registerAndGetToken(String password) throws Exception {
        String email = "hard." + UUID.randomUUID() + "@gmail.com";
        Map<String, Object> body = new HashMap<>();
        body.put("fullName", "Người dùng hardening");
        body.put("email", email);
        body.put("password", password);
        assertThat(mvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(body))).andReturn().getResponse().getStatus()).isEqualTo(200);

        MvcResult login = mvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("email", email, "password", password)))).andReturn();
        return json(login).at("/data/token").asText();
    }

    // --- CORS ---

    @Test
    void allowedOriginGetsCorsHeadersWithCredentials() throws Exception {
        MvcResult result = mvc.perform(options("/api/v1/wallets")
                .header("Origin", "http://localhost:3000")
                .header("Access-Control-Request-Method", "GET")
                .header("Access-Control-Request-Headers", "Authorization")).andReturn();

        assertThat(result.getResponse().getStatus()).isEqualTo(200);
        assertThat(result.getResponse().getHeader("Access-Control-Allow-Origin"))
                .isEqualTo("http://localhost:3000");
        assertThat(result.getResponse().getHeader("Access-Control-Allow-Credentials")).isEqualTo("true");
    }

    @Test
    void foreignOriginGetsNoCorsHeaders() throws Exception {
        MvcResult result = mvc.perform(options("/api/v1/wallets")
                .header("Origin", "http://budglee-dich-vu.info")
                .header("Access-Control-Request-Method", "GET")
                .header("Access-Control-Request-Headers", "Authorization")).andReturn();

        assertThat(result.getResponse().getHeader("Access-Control-Allow-Origin"))
                .as("origin lạ không được cấp quyền gọi API kèm credential của trình duyệt nạn nhân")
                .isNull();
    }

    @Test
    void wildcardOriginIsNoLongerAcceptedForCredentialledRequests() throws Exception {
        String token = registerAndGetToken("MatKhau123");

        MvcResult result = mvc.perform(get("/api/v1/wallets")
                .header("Origin", "http://localhost:9999")
                .header("Authorization", "Bearer " + token)).andReturn();

        assertThat(result.getResponse().getHeader("Access-Control-Allow-Origin"))
                .as("* + allowCredentials trước đây cho mọi trang web đọc được số dư của người dùng")
                .isNull();
    }

    // --- Swagger / actuator ---

    @Test
    void actuatorIsNotPubliclyReachable() throws Exception {
        MvcResult result = mvc.perform(get("/actuator/health")).andReturn();

        assertThat(result.getResponse().getStatus())
                .as("pom không có spring-boot-starter-actuator nên để permitAll chỉ tổ mở đường dò")
                .isEqualTo(401);
    }

    @Test
    void swaggerUiStaysPublicForTheDemo() throws Exception {
        assertThat(mvc.perform(get("/swagger-ui.html")).andReturn().getResponse().getStatus())
                .as("bỏ /actuator/** không được kéo theo swagger của demo")
                .isNotEqualTo(401);
    }

    // --- Chính sách mật khẩu ---

    @Test
    void shortOrWeakPasswordIsRejectedAtRegistration() throws Exception {
        assertThat(registerRaw("1234567").getResponse().getStatus()).isEqualTo(400);
        assertThat(registerRaw("abcd1234").getResponse().getStatus())
                .as("không có chữ HOA nào")
                .isEqualTo(400);
        assertThat(registerRaw("ABCDEFGH").getResponse().getStatus())
                .as("không có chữ số nào")
                .isEqualTo(400);
    }

    @Test
    void strongPasswordIsAcceptedAndLogsIn() throws Exception {
        assertThat(registerAndGetToken("MatKhau123")).startsWith("eyJ");
    }

    private MvcResult registerRaw(String password) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("fullName", "Người dùng hardening");
        body.put("email", "weak." + UUID.randomUUID() + "@gmail.com");
        body.put("password", password);
        return mvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(body))).andReturn();
    }

    // --- Phân trang ---

    @Test
    void requestedPageSizeIsClampedToAHundred() throws Exception {
        String token = registerAndGetToken("MatKhau123");

        JsonNode huge = json(mvc.perform(get("/api/v1/transactions")
                .header("Authorization", "Bearer " + token)
                .param("page", "0")
                .param("size", "1000000")).andReturn());
        assertThat(huge.at("/data/pageable/pageSize").asInt()).isEqualTo(100);

        JsonNode negative = json(mvc.perform(get("/api/v1/transactions")
                .header("Authorization", "Bearer " + token)
                .param("page", "-5")
                .param("size", "0")).andReturn());
        assertThat(negative.at("/data/pageable/pageSize").asInt()).isEqualTo(1);
        assertThat(negative.at("/data/pageable/pageNumber").asInt()).isZero();
    }
}
