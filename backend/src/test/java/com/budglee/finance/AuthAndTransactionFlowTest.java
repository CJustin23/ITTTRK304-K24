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
import org.springframework.test.web.servlet.ResultActions;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthAndTransactionFlowTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper om;

    private JsonNode body(MvcResult result) throws Exception {
        return om.readTree(result.getResponse().getContentAsString());
    }

    private String newEmail() {
        return "test." + UUID.randomUUID() + "@budglee.dev";
    }

    private String register(String email, String password) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of(
                                "fullName", "Nguyễn Trường An",
                                "email", email,
                                "password", password,
                                "role", "INDIVIDUAL_USER"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();
        return body(result).at("/data/token").asText();
    }

    private long createWallet(String token, String name, String balance) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/wallets")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of(
                                "walletName", name,
                                "type", "CASH",
                                "currency", "VND",
                                "balance", balance))))
                .andExpect(status().isOk())
                .andReturn();
        return body(result).at("/data/id").asLong();
    }

    private long createCategory(String token, String name) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/categories")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of(
                                "name", name,
                                "type", "EXPENSE",
                                "icon", "shopping-bag",
                                "colorCode", "#22C55E"))))
                .andExpect(status().isOk())
                .andReturn();
        return body(result).at("/data/id").asLong();
    }

    private ResultActions transaction(String token, Map<String, Object> fields) throws Exception {
        return mvc.perform(post("/api/v1/transactions")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(fields)));
    }

    private BigDecimal decimalAt(MvcResult result, String pointer) throws Exception {
        return body(result).at(pointer).decimalValue();
    }

    @Test
    void registerIssuesRealJwtAndReturnsProfile() throws Exception {
        String email = newEmail();
        MvcResult result = mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of(
                                "fullName", "Nguyễn Trường An",
                                "email", email,
                                "password", "MatKhau123",
                                "role", "INDIVIDUAL_USER"))))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode data = body(result).at("/data");
        assertThat(data.at("/token").asText()).startsWith("eyJ");
        assertThat(data.at("/email").asText()).isEqualTo(email);
        assertThat(data.at("/role").asText()).isEqualTo("INDIVIDUAL_USER");
        assertThat(result.getResponse().getContentAsString()).doesNotContain("mock-token");
    }

    @Test
    void registerRejectsDuplicateEmailRegardlessOfCase() throws Exception {
        String email = newEmail();
        register(email, "MatKhau123");

        mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of(
                                "fullName", "Người thứ hai",
                                "email", email.toUpperCase(),
                                "password", "MatKhau456",
                                "role", "INDIVIDUAL_USER"))))
                .andExpect(status().isConflict());
    }

    @Test
    void loginRejectsWrongPassword() throws Exception {
        String email = newEmail();
        register(email, "MatKhau123");

        mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of(
                                "email", email,
                                "password", "SaiRoi"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginAcceptsCorrectPasswordAndUsesSameTokenAsRegister() throws Exception {
        String email = newEmail();
        register(email, "MatKhau123");

        MvcResult result = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of(
                                "email", email,
                                "password", "MatKhau123"))))
                .andExpect(status().isOk())
                .andReturn();

        assertThat(body(result).at("/data/token").asText()).startsWith("eyJ");
    }

    @Test
    void expenseDecreasesBalanceAndBlocksOverspend() throws Exception {
        String token = register(newEmail(), "MatKhau123");
        long walletId = createWallet(token, "Ví chính", "100000");
        long categoryId = createCategory(token, "Ăn uống");

        MvcResult created = transaction(token, Map.of(
                "walletId", walletId,
                "categoryId", categoryId,
                "actionTitle", "Cơm trưa",
                "amount", "30000",
                "transactionType", "EXPENSE"))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(decimalAt(created, "/data/balanceAfter")).isEqualByComparingTo("70000");

        transaction(token, Map.of(
                "walletId", walletId,
                "actionTitle", "Chi quá số dư",
                "amount", "500000",
                "transactionType", "EXPENSE"))
                .andExpect(status().isBadRequest());

        MvcResult wallets = mvc.perform(get("/api/v1/wallets").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(decimalAt(wallets, "/data/0/balance")).isEqualByComparingTo("70000");
        assertThat(wallets.getResponse().getContentAsString()).doesNotContain("passwordHash");

        mvc.perform(get("/api/v1/transactions").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.content[0].actionTitle").value("Cơm trưa"));
    }

    @Test
    void creditCardWalletMayGoNegative() throws Exception {
        String token = register(newEmail(), "MatKhau123");
        MvcResult card = mvc.perform(post("/api/v1/wallets")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of(
                                "walletName", "Thẻ tín dụng",
                                "type", "CREDIT_CARD",
                                "currency", "VND",
                                "balance", "50000"))))
                .andExpect(status().isOk())
                .andReturn();
        long cardId = body(card).at("/data/id").asLong();

        transaction(token, Map.of(
                "walletId", cardId,
                "actionTitle", "Mua trả góp",
                "amount", "80000",
                "transactionType", "EXPENSE"))
                .andExpect(status().isOk());
    }

    @Test
    void incomeIncreasesBalance() throws Exception {
        String token = register(newEmail(), "MatKhau123");
        long walletId = createWallet(token, "Ví phụ", "50000");

        MvcResult result = transaction(token, Map.of(
                "walletId", walletId,
                "actionTitle", "Lương",
                "amount", "1000000",
                "transactionType", "INCOME"))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(decimalAt(result, "/data/balanceAfter")).isEqualByComparingTo("1050000");
    }

    @Test
    void cannotSpendFromAnotherUsersWallet() throws Exception {
        String ownerToken = register(newEmail(), "MatKhau123");
        long ownerWallet = createWallet(ownerToken, "Ví của chủ", "200000");

        String intruderToken = register(newEmail(), "MatKhau123");
        transaction(intruderToken, Map.of(
                "walletId", ownerWallet,
                "actionTitle", "Chi hộ",
                "amount", "1000",
                "transactionType", "EXPENSE"))
                .andExpect(status().isNotFound());

        MvcResult wallets = mvc.perform(get("/api/v1/wallets").header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(decimalAt(wallets, "/data/0/balance")).isEqualByComparingTo("200000");
    }

    @Test
    void anonymousCallsAreRejected() throws Exception {
        mvc.perform(post("/api/v1/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of(
                                "walletId", 1,
                                "actionTitle", "Không đăng nhập",
                                "amount", "1000",
                                "transactionType", "EXPENSE"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void transferIsExplicitlyNotSupportedYet() throws Exception {
        String token = register(newEmail(), "MatKhau123");
        long walletId = createWallet(token, "Ví chuyển", "100000");

        transaction(token, Map.of(
                "walletId", walletId,
                "actionTitle", "Chuyển ví",
                "amount", "10000",
                "transactionType", "TRANSFER"))
                .andExpect(status().isNotImplemented());
    }
}
