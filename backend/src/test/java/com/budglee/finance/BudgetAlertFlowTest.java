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

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * DUAN-43 — ngân sách và cảnh báo ngưỡng, đồng thời là chuỗi nghiệp vụ hoàn chỉnh
 * mà nhóm sẽ demo: đăng ký -> đăng nhập -> ví -> danh mục -> chi -> ngân sách -> cảnh báo.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BudgetAlertFlowTest {

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
        register.put("fullName", "Người dùng ngân sách");
        register.put("email", "budget." + UUID.randomUUID() + "@budglee.dev");
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

    private long wallet(String token, String name, String balance) throws Exception {
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
        return json(result).at("/data/id").asLong();
    }

    private long category(String token, String name, String type) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/categories")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of(
                                "name", name,
                                "type", type,
                                "icon", "utensils",
                                "colorCode", "#22C55E"))))
                .andExpect(status().isOk())
                .andReturn();
        return json(result).at("/data/id").asLong();
    }

    private void spend(String token, long walletId, Long categoryId, String amount) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("walletId", walletId);
        body.put("actionTitle", "Chi demo");
        body.put("amount", amount);
        body.put("transactionType", "EXPENSE");
        if (categoryId != null) {
            body.put("categoryId", categoryId);
        }
        mvc.perform(post("/api/v1/transactions")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(body)))
                .andExpect(status().isOk());
    }

    private MvcResult setBudget(String token, Map<String, Object> fields) throws Exception {
        return mvc.perform(post("/api/v1/budgets")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(fields)))
                .andReturn();
    }

    private JsonNode budgets(String token) throws Exception {
        LocalDateTime now = LocalDateTime.now();
        MvcResult result = mvc.perform(get("/api/v1/budgets")
                        .header("Authorization", "Bearer " + token)
                        .param("month", String.valueOf(now.getMonthValue()))
                        .param("year", String.valueOf(now.getYear())))
                .andExpect(status().isOk())
                .andReturn();
        return json(result).at("/data");
    }

    private Map<String, Object> currentPeriod(long categoryId, String limit) {
        LocalDateTime now = LocalDateTime.now();
        Map<String, Object> body = new HashMap<>();
        if (categoryId > 0) {
            body.put("categoryId", categoryId);
        }
        body.put("amountLimit", limit);
        body.put("periodMonth", now.getMonthValue());
        body.put("periodYear", now.getYear());
        return body;
    }

    @Test
    void fullDemoFlowEndsWithWarningThenExceeded() throws Exception {
        String token = loginNewUser();
        long walletId = wallet(token, "Ví tiền mặt", "1000000");
        long foodId = category(token, "Ăn uống", "EXPENSE");

        assertThat(setBudget(token, currentPeriod(foodId, "100000")).getResponse().getStatus()).isEqualTo(200);

        spend(token, walletId, foodId, "30000");
        assertThat(budgets(token).at("/0/alertLevel").asText()).isEqualTo("OK");
        assertThat(budgets(token).at("/0/spentAmount").decimalValue()).isEqualByComparingTo("30000");

        spend(token, walletId, foodId, "55000");
        assertThat(budgets(token).at("/0/alertLevel").asText()).isEqualTo("WARNING");

        spend(token, walletId, foodId, "20000");
        assertThat(budgets(token).at("/0/alertLevel").asText()).isEqualTo("EXCEEDED");
        assertThat(budgets(token).at("/0/spentAmount").decimalValue()).isEqualByComparingTo("105000");
    }

    @Test
    void settingTheSamePeriodAgainUpdatesInsteadOfDuplicating() throws Exception {
        String token = loginNewUser();
        long foodId = category(token, "Cà phê", "EXPENSE");

        setBudget(token, currentPeriod(foodId, "100000"));
        setBudget(token, currentPeriod(foodId, "250000"));

        JsonNode list = budgets(token);
        assertThat(list.size()).isEqualTo(1);
        assertThat(list.at("/0/amountLimit").decimalValue()).isEqualByComparingTo("250000");
    }

    @Test
    void budgetWithoutCategoryCountsEveryExpenseOfThePeriod() throws Exception {
        String token = loginNewUser();
        long walletId = wallet(token, "Ví tổng hợp", "1000000");
        long foodId = category(token, "Ăn", "EXPENSE");
        long travelId = category(token, "Đi lại", "EXPENSE");

        assertThat(setBudget(token, currentPeriod(0, "200000")).getResponse().getStatus()).isEqualTo(200);
        spend(token, walletId, foodId, "70000");
        spend(token, walletId, travelId, "90000");

        JsonNode list = budgets(token);
        assertThat(list.at("/0/spentAmount").decimalValue()).isEqualByComparingTo("160000");
        assertThat(list.at("/0/alertLevel").asText()).isEqualTo("WARNING");
    }

    @Test
    void customAlertThresholdIsStoredAndUsed() throws Exception {
        String token = loginNewUser();
        long walletId = wallet(token, "Ví ngưỡng riêng", "1000000");
        long hobbyId = category(token, "Sở thích", "EXPENSE");

        Map<String, Object> body = currentPeriod(hobbyId, "100000");
        body.put("alertThreshold", "50.00");
        MvcResult created = setBudget(token, body);

        assertThat(created.getResponse().getStatus()).isEqualTo(200);
        assertThat(json(created).at("/data/alertThreshold").decimalValue()).isEqualByComparingTo("50.00");

        spend(token, walletId, hobbyId, "55000");
        assertThat(budgets(token).at("/0/alertLevel").asText()).isEqualTo("WARNING");
    }

    @Test
    void budgetForIncomeCategoryIsRejected() throws Exception {
        String token = loginNewUser();
        long salaryId = category(token, "Lương", "INCOME");

        MvcResult result = setBudget(token, currentPeriod(salaryId, "100000"));

        assertThat(result.getResponse().getStatus()).isEqualTo(400);
        assertThat(json(result).at("/message").asText()).contains("EXPENSE");
    }

    @Test
    void anotherUserCannotSeeMyBudgets() throws Exception {
        String ownerToken = loginNewUser();
        long foodId = category(ownerToken, "Ăn của chủ", "EXPENSE");
        setBudget(ownerToken, currentPeriod(foodId, "100000"));

        String intruderToken = loginNewUser();

        assertThat(budgets(intruderToken).size()).isZero();
    }

    @Test
    void budgetAmountMustBePositive() throws Exception {
        String token = loginNewUser();
        long foodId = category(token, "Ăn sai số tiền", "EXPENSE");

        assertThat(setBudget(token, currentPeriod(foodId, "0")).getResponse().getStatus()).isEqualTo(400);
    }
}
