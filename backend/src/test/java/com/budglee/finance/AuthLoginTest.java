package com.budglee.finance;

import com.budglee.finance.repository.UserRepository;
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

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * DUAN-39 — phần đăng nhập và cấp JWT.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthLoginTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper om;

    @Autowired
    private UserRepository userRepository;

    private static String textOf(MvcResult result) {
        return new String(result.getResponse().getContentAsByteArray(), StandardCharsets.UTF_8);
    }

    private String newEmail() {
        return "login." + UUID.randomUUID() + "@budglee.dev";
    }

    private void registerUser(String email) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("fullName", "Người đăng nhập");
        body.put("email", email);
        body.put("password", "MatKhau123");
        mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(body)))
                .andExpect(status().isOk());
    }

    private MvcResult login(String email, String password) throws Exception {
        return mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of("email", email, "password", password))))
                .andReturn();
    }

    private JsonNode data(MvcResult result) throws Exception {
        return om.readTree(textOf(result)).at("/data");
    }

    private JsonNode decodePayload(String jwt) throws Exception {
        String payload = jwt.split("\\.")[1];
        return om.readTree(Base64.getUrlDecoder().decode(payload));
    }

    @Test
    void correctCredentialsIssueARealJwt() throws Exception {
        String email = newEmail();
        registerUser(email);

        MvcResult result = login(email, "MatKhau123");

        assertThat(result.getResponse().getStatus()).isEqualTo(200);
        JsonNode body = data(result);
        String token = body.at("/token").asText();
        assertThat(token).isNotEqualTo("mock-token").startsWith("eyJ");
        assertThat(body.at("/type").asText()).isEqualTo("Bearer");
        assertThat(body.at("/email").asText()).isEqualTo(email);
        assertThat(body.at("/role").asText()).isEqualTo("INDIVIDUAL_USER");
        assertThat(body.at("/id").asLong()).isPositive();
        assertThat(textOf(result)).doesNotContain("MatKhau123").doesNotContain("passwordHash");
    }

    @Test
    void tokenCarriesTheClaimsTheFilterNeeds() throws Exception {
        String email = newEmail();
        registerUser(email);

        String token = data(login(email, "MatKhau123")).at("/token").asText();
        JsonNode claims = decodePayload(token);

        assertThat(claims.at("/sub").asText()).isEqualTo(email);
        assertThat(claims.at("/userId").asLong())
                .isEqualTo(userRepository.findByEmail(email).orElseThrow().getId());
        assertThat(claims.has("exp")).isTrue();
    }

    @Test
    void issuedTokenIsAcceptedByTheJwtFilterOnProtectedEndpoints() throws Exception {
        String email = newEmail();
        registerUser(email);
        String token = data(login(email, "MatKhau123")).at("/token").asText();

        mvc.perform(get("/api/v1/budgets")
                        .header("Authorization", "Bearer " + token)
                        .param("month", "10")
                        .param("year", "2026"))
                .andExpect(status().isOk());
    }

    @Test
    void protectedEndpointRejectsWhenNoTokenIsPresented() throws Exception {
        mvc.perform(get("/api/v1/budgets").param("month", "10").param("year", "2026"))
                .andExpect(status().isForbidden());
    }

    @Test
    void tamperedTokenIsRejected() throws Exception {
        String email = newEmail();
        registerUser(email);
        String token = data(login(email, "MatKhau123")).at("/token").asText();
        String tampered = token.substring(0, token.length() - 4) + "AAAA";

        mvc.perform(get("/api/v1/budgets")
                        .header("Authorization", "Bearer " + tampered)
                        .param("month", "10")
                        .param("year", "2026"))
                .andExpect(status().isForbidden());
    }

    @Test
    void wrongPasswordAndUnknownEmailReturnTheSameMessage() throws Exception {
        String email = newEmail();
        registerUser(email);

        MvcResult badPassword = login(email, "SaiRoi123");
        MvcResult unknownEmail = login("khong.ton.tai." + UUID.randomUUID() + "@budglee.dev", "MatKhau123");

        assertThat(badPassword.getResponse().getStatus()).isEqualTo(401);
        assertThat(unknownEmail.getResponse().getStatus()).isEqualTo(401);

        String firstMessage = om.readTree(textOf(badPassword)).at("/message").asText();
        String secondMessage = om.readTree(textOf(unknownEmail)).at("/message").asText();
        assertThat(firstMessage).isEqualTo("Email hoặc mật khẩu không đúng").isEqualTo(secondMessage);
        assertThat(textOf(badPassword)).doesNotContain("Không tìm thấy người dùng");
    }

    @Test
    void upperCaseEmailStillLogsInBecauseItIsNormalised() throws Exception {
        String email = newEmail();
        registerUser(email);

        assertThat(login(email.toUpperCase(), "MatKhau123").getResponse().getStatus()).isEqualTo(200);
    }
}
