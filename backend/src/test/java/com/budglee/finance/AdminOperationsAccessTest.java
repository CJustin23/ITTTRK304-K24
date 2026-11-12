package com.budglee.finance;

import com.budglee.finance.entity.ChatbotApiKey;
import com.budglee.finance.entity.Role;
import com.budglee.finance.entity.User;
import com.budglee.finance.repository.ChatbotApiKeyRepository;
import com.budglee.finance.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminOperationsAccessTest {
    private static final String PASSWORD = "MatKhau123";

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired UserRepository users;
    @Autowired ChatbotApiKeyRepository keys;
    @Autowired PasswordEncoder passwordEncoder;

    private record Account(long id, String token) { }

    private Account account(Role role) throws Exception {
        String email = "admin.ops." + UUID.randomUUID() + "@gmail.com";
        User user = users.save(User.builder().fullName("Test " + role).email(email)
                .passwordHash(passwordEncoder.encode(PASSWORD)).role(role).build());
        String body = mapper.writeValueAsString(Map.of("email", email, "password", PASSWORD));
        MvcResult result = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content(body)).andReturn();
        return new Account(user.getId(), mapper.readTree(result.getResponse().getContentAsString()).at("/data/token").asText());
    }

    private MvcResult get(String path, Account actor) throws Exception {
        return mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(path)
                .header("Authorization", "Bearer " + actor.token())).andReturn();
    }

    @Test
    void statsAreAggregateOnlyAndAdminEndpointsDenyOtherRoles() throws Exception {
        Account admin = account(Role.SYSTEM_ADMIN);
        Account user = account(Role.INDIVIDUAL_USER);

        assertThat(mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/admin/stats"))
                .andReturn().getResponse().getStatus()).isEqualTo(401);
        assertThat(get("/api/v1/admin/stats", user).getResponse().getStatus()).isEqualTo(403);
        MvcResult result = get("/api/v1/admin/stats", admin);

        assertThat(result.getResponse().getStatus()).isEqualTo(200);
        JsonNode data = mapper.readTree(result.getResponse().getContentAsString()).at("/data");
        Set<String> names = new HashSet<>();
        data.fieldNames().forEachRemaining(names::add);
        assertThat(names).containsExactlyInAnyOrder(
                "totalAccounts", "disabledAccounts", "familyGroups", "transactionsLast24Hours");
    }

    @Test
    void chatbotKeysAreEncryptedMaskedAndAdminOnly() throws Exception {
        Account admin = account(Role.SYSTEM_ADMIN);
        Account user = account(Role.INDIVIDUAL_USER);
        String secret = "sk-test-" + UUID.randomUUID();

        MvcResult created = mvc.perform(post("/api/v1/admin/chatbot-keys")
                .header("Authorization", "Bearer " + admin.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("provider", "Gemini", "key", secret)))).andReturn();

        assertThat(created.getResponse().getStatus()).isEqualTo(200);
        JsonNode createdData = mapper.readTree(created.getResponse().getContentAsString()).at("/data");
        long id = createdData.at("/id").asLong();
        assertThat(createdData.has("key")).isFalse();
        assertThat(createdData.at("/maskedKey").asText()).doesNotContain(secret);
        ChatbotApiKey stored = keys.findById(id).orElseThrow();
        assertThat(stored.getKeyCiphertext()).doesNotContain(secret);

        MvcResult list = get("/api/v1/admin/chatbot-keys", admin);
        assertThat(list.getResponse().getContentAsString()).doesNotContain(secret);
        assertThat(get("/api/v1/admin/chatbot-keys", user).getResponse().getStatus()).isEqualTo(403);
        MvcResult reveal = get("/api/v1/admin/chatbot-keys/" + id + "/reveal", admin);
        assertThat(mapper.readTree(reveal.getResponse().getContentAsString()).at("/data").asText()).isEqualTo(secret);

        String auth = "Bearer " + admin.token();
        MvcResult activated = mvc.perform(put("/api/v1/admin/chatbot-keys/" + id + "/status")
                .header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("active", true)))).andReturn();
        assertThat(mapper.readTree(activated.getResponse().getContentAsString()).at("/data/active").asBoolean()).isTrue();
        MvcResult deleted = mvc.perform(delete("/api/v1/admin/chatbot-keys/" + id).header("Authorization", auth)).andReturn();
        assertThat(deleted.getResponse().getStatus()).isEqualTo(200);
        assertThat(keys.findById(id)).isEmpty();
    }
}
