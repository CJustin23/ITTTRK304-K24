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

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * DUAN-50 — luồng ghi nhận giao dịch và số dư ví, cũng là kịch bản demo của nhóm.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TransactionFlowTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper om;

    private static String textOf(MvcResult result) {
        return new String(result.getResponse().getContentAsByteArray(), StandardCharsets.UTF_8);
    }

    private JsonNode json(MvcResult result) throws Exception {
        return om.readTree(textOf(result));
    }

    private String loginNewUser() throws Exception {
        Map<String, Object> register = new HashMap<>();
        register.put("fullName", "Người dùng demo");
        register.put("email", "tx." + UUID.randomUUID() + "@budglee.dev");
        register.put("password", "MatKhau123");
        mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(register)))
                .andExpect(status().isOk());

        MvcResult login = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of(
                                "email", register.get("email"),
                                "password", "MatKhau123"))))
                .andExpect(status().isOk())
                .andReturn();
        return json(login).at("/data/token").asText();
    }

    private long createWallet(String token, String name, String type, String balance) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/wallets")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of(
                                "walletName", name,
                                "type", type,
                                "currency", "VND",
                                "balance", balance))))
                .andExpect(status().isOk())
                .andReturn();
        return json(result).at("/data/id").asLong();
    }

    private long createCategory(String token, String name) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/categories")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of(
                                "name", name,
                                "type", "EXPENSE",
                                "icon", "utensils",
                                "colorCode", "#22C55E"))))
                .andExpect(status().isOk())
                .andReturn();
        return json(result).at("/data/id").asLong();
    }

    private MvcResult transaction(String token, Map<String, Object> fields) throws Exception {
        return mvc.perform(post("/api/v1/transactions")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(fields)))
                .andReturn();
    }

    private BigDecimal walletBalance(String token, int index) throws Exception {
        MvcResult result = mvc.perform(get("/api/v1/wallets")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        return json(result).at("/data/" + index + "/balance").decimalValue();
    }

    @Test
    void expenseDecreasesWalletBalanceAndRecordsBalanceAfter() throws Exception {
        String token = loginNewUser();
        long walletId = createWallet(token, "Ví tiền mặt", "CASH", "1000000");
        long categoryId = createCategory(token, "Ăn uống");

        MvcResult created = transaction(token, Map.of(
                "walletId", walletId,
                "categoryId", categoryId,
                "actionTitle", "Cơm trưa",
                "amount", "350000",
                "transactionType", "EXPENSE"));

        assertThat(created.getResponse().getStatus()).isEqualTo(200);
        assertThat(json(created).at("/data/balanceAfter").decimalValue()).isEqualByComparingTo("650000");
        assertThat(walletBalance(token, 0)).isEqualByComparingTo("650000");
    }

    @Test
    void walletListDoesNotLeakPasswordHash() throws Exception {
        String token = loginNewUser();
        createWallet(token, "Ví kiểm tra", "CASH", "100000");

        MvcResult result = mvc.perform(get("/api/v1/wallets").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        assertThat(textOf(result)).doesNotContain("passwordHash").doesNotContain("$2a$");
    }

    @Test
    void overspendOnCashWalletIsRejectedAndLeavesBalanceUntouched() throws Exception {
        String token = loginNewUser();
        long walletId = createWallet(token, "Ví chặt chi tiêu", "CASH", "100000");

        MvcResult rejected = transaction(token, Map.of(
                "walletId", walletId,
                "actionTitle", "Mua điện thoại",
                "amount", "900000",
                "transactionType", "EXPENSE"));

        assertThat(rejected.getResponse().getStatus()).isEqualTo(400);
        assertThat(json(rejected).at("/message").asText()).contains("Số dư ví không đủ");
        assertThat(walletBalance(token, 0)).isEqualByComparingTo("100000");
    }

    @Test
    void creditCardWalletMayGoNegative() throws Exception {
        String token = loginNewUser();
        long cardId = createWallet(token, "Thẻ tín dụng", "CREDIT_CARD", "50000");

        MvcResult result = transaction(token, Map.of(
                "walletId", cardId,
                "actionTitle", "Mua trả góp",
                "amount", "80000",
                "transactionType", "EXPENSE"));

        assertThat(result.getResponse().getStatus()).isEqualTo(200);
        assertThat(json(result).at("/data/balanceAfter").decimalValue()).isEqualByComparingTo("-30000");
    }

    @Test
    void incomeIncreasesBalance() throws Exception {
        String token = loginNewUser();
        long walletId = createWallet(token, "Ví nhận lương", "BANK", "500000");

        MvcResult result = transaction(token, Map.of(
                "walletId", walletId,
                "actionTitle", "Lương tháng",
                "amount", "10000000",
                "transactionType", "INCOME"));

        assertThat(result.getResponse().getStatus()).isEqualTo(200);
        assertThat(json(result).at("/data/balanceAfter").decimalValue()).isEqualByComparingTo("10500000");
    }

    @Test
    void historyIsPaginatedAndOnlyShowsOwnTransactions() throws Exception {
        String token = loginNewUser();
        long walletId = createWallet(token, "Ví nhiều giao dịch", "CASH", "1000000");
        for (int i = 1; i <= 3; i++) {
            transaction(token, Map.of(
                    "walletId", walletId,
                    "actionTitle", "Chi " + i,
                    "amount", "1000",
                    "transactionType", "EXPENSE"));
        }

        MvcResult page = mvc.perform(get("/api/v1/transactions")
                        .header("Authorization", "Bearer " + token)
                        .param("page", "0")
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andReturn();

        assertThat(json(page).at("/data/totalElements").asInt()).isEqualTo(3);
        assertThat(json(page).at("/data/content").size()).isEqualTo(2);

        String otherToken = loginNewUser();
        MvcResult other = mvc.perform(get("/api/v1/transactions")
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(json(other).at("/data/totalElements").asInt()).isZero();
    }

    @Test
    void cannotSpendFromAnotherUsersWallet() throws Exception {
        String ownerToken = loginNewUser();
        long ownerWallet = createWallet(ownerToken, "Ví của chủ", "CASH", "500000");

        String intruderToken = loginNewUser();
        MvcResult result = transaction(intruderToken, Map.of(
                "walletId", ownerWallet,
                "actionTitle", "Chi hộ",
                "amount", "10000",
                "transactionType", "EXPENSE"));

        assertThat(result.getResponse().getStatus()).isEqualTo(404);
        assertThat(walletBalance(ownerToken, 0)).isEqualByComparingTo("500000");
    }

    @Test
    void transferBetweenWalletsIsReportedAsNotImplemented() throws Exception {
        String token = loginNewUser();
        long walletId = createWallet(token, "Ví chờ chuyển", "CASH", "100000");

        MvcResult result = transaction(token, Map.of(
                "walletId", walletId,
                "actionTitle", "Chuyển khoản",
                "amount", "10000",
                "transactionType", "TRANSFER"));

        assertThat(result.getResponse().getStatus()).isEqualTo(501);
        assertThat(walletBalance(token, 0)).isEqualByComparingTo("100000");
    }

    @Test
    void nonPositiveAmountIsRejected() throws Exception {
        String token = loginNewUser();
        long walletId = createWallet(token, "Ví số tiền lỗi", "CASH", "100000");

        assertThat(transaction(token, Map.of(
                "walletId", walletId,
                "actionTitle", "Không số tiền",
                "amount", "0",
                "transactionType", "EXPENSE")).getResponse().getStatus()).isEqualTo(400);
    }
}
