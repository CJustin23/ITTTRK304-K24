package com.budglee.finance;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.budglee.finance.entity.Wallet;
import com.budglee.finance.repository.WalletRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * DUAN-48 — tạo ví qua DTO: chặn chiếm quyền sở hữu bằng "id" gửi từ body và chặn số thẻ đầy đủ.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class WalletFlowTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper om;

    @Autowired
    private WalletRepository walletRepository;

    private static String textOf(MvcResult result) {
        return new String(result.getResponse().getContentAsByteArray(), StandardCharsets.UTF_8);
    }

    private JsonNode json(MvcResult result) throws Exception {
        return om.readTree(textOf(result));
    }

    private String loginNewUser() throws Exception {
        String email = "wallet." + UUID.randomUUID() + "@budglee.dev";
        mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of(
                                "fullName", "Chủ ví",
                                "email", email,
                                "password", "MatKhau123"))))
                .andExpect(status().isOk());

        MvcResult login = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of("email", email, "password", "MatKhau123"))))
                .andExpect(status().isOk())
                .andReturn();
        return json(login).at("/data/token").asText();
    }

    private MvcResult createWallet(String token, Map<String, Object> payload) throws Exception {
        return mvc.perform(post("/api/v1/wallets")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(payload)))
                .andReturn();
    }

    private Optional<Wallet> find(long id) {
        return walletRepository.findById(id);
    }

    @Test
    void createsWalletWithDefaultsWhenOptionalFieldsOmitted() throws Exception {
        String token = loginNewUser();

        MvcResult result = createWallet(token, Map.of("walletName", "Ví tiền mặt", "type", "CASH"));

        assertThat(result.getResponse().getStatus()).isEqualTo(200);
        JsonNode data = json(result).at("/data");
        assertThat(data.at("/currency").asText()).isEqualTo("VND");
        assertThat(data.at("/balance").decimalValue()).isEqualByComparingTo("0");
        assertThat(data.at("/user/id").asLong()).isPositive();
    }

    @Test
    void rejectsMissingAndInvalidFields() throws Exception {
        String token = loginNewUser();

        assertThat(createWallet(token, Map.of()).getResponse().getStatus()).isEqualTo(400);
        assertThat(createWallet(token, Map.of("walletName", "Thiếu loại")).getResponse().getStatus()).isEqualTo(400);
        assertThat(createWallet(token, Map.of("walletName", "Âm", "type", "CASH", "balance", "-1"))
                .getResponse().getStatus()).isEqualTo(400);
        assertThat(createWallet(token, Map.of("walletName", "A".repeat(120), "type", "CASH"))
                .getResponse().getStatus()).isEqualTo(400);
    }

    @Test
    void postingAnotherUsersWalletIdCreatesNewWalletInsteadOfStealing() throws Exception {
        String ownerToken = loginNewUser();
        MvcResult ownerWallet = createWallet(ownerToken, Map.of(
                "walletName", "Ví của chủ", "type", "CASH", "balance", "500000"));
        long ownerWalletId = json(ownerWallet).at("/data/id").asLong();

        String attackerToken = loginNewUser();
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", ownerWalletId);
        payload.put("walletName", "Kẻ gian chiếm ví");
        payload.put("type", "CASH");
        payload.put("balance", "1");
        MvcResult attackerResult = createWallet(attackerToken, payload);

        assertThat(attackerResult.getResponse().getStatus()).isEqualTo(200);
        long createdId = json(attackerResult).at("/data/id").asLong();
        assertThat(createdId).isNotEqualTo(ownerWalletId);

        Wallet untouched = find(ownerWalletId).orElseThrow();
        assertThat(untouched.getWalletName()).isEqualTo("Ví của chủ");
        assertThat(untouched.getBalance()).isEqualByComparingTo("500000");
        assertThat(untouched.getUser().getId())
                .isEqualTo(json(ownerWallet).at("/data/user/id").asLong());

        MvcResult ownerList = mvc.perform(get("/api/v1/wallets").header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(json(ownerList).at("/data").size()).isEqualTo(1);
        assertThat(json(ownerList).at("/data/0/id").asLong()).isEqualTo(ownerWalletId);
    }

    @Test
    void refusesToStoreAnUnmaskedCardNumber() throws Exception {
        String token = loginNewUser();

        MvcResult result = createWallet(token, Map.of(
                "walletName", "Thẻ ghi nợ",
                "type", "BANK",
                "cardNumberMasked", "4242424242424242"));

        assertThat(result.getResponse().getStatus()).isEqualTo(400);
        assertThat(json(result).at("/message").asText()).contains("số thẻ đã che");

        MvcResult masked = createWallet(token, Map.of(
                "walletName", "Thẻ hợp lệ",
                "type", "CREDIT_CARD",
                "cardNumberMasked", "**** **** **** 4242"));
        assertThat(masked.getResponse().getStatus()).isEqualTo(200);
    }

    @Test
    void anonymousCannotCreateWallet() throws Exception {
        mvc.perform(post("/api/v1/wallets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of("walletName", "Ví ẩn danh", "type", "CASH"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void newWalletStillFeedsTransactionFlow() throws Exception {
        String token = loginNewUser();
        long walletId = json(createWallet(token, Map.of(
                "walletName", "Ví chi tiêu", "type", "CASH", "balance", "200000")))
                .at("/data/id").asLong();

        MvcResult transaction = mvc.perform(post("/api/v1/transactions")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of(
                                "walletId", walletId,
                                "actionTitle", "Cafe",
                                "amount", "20000",
                                "transactionType", "EXPENSE"))))
                .andExpect(status().isOk())
                .andReturn();

        assertThat(json(transaction).at("/data/balanceAfter").decimalValue())
                .isEqualByComparingTo(new BigDecimal("180000"));
    }
}
