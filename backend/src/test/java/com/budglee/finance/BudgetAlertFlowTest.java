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

import java.time.LocalDateTime;
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
class BudgetAlertFlowTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper om;

    private JsonNode body(MvcResult result) throws Exception {
        return om.readTree(result.getResponse().getContentAsString());
    }

    private String register() throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of(
                                "fullName", "Người thử nghiệm",
                                "email", "budget." + UUID.randomUUID() + "@budglee.dev",
                                "password", "MatKhau123",
                                "role", "INDIVIDUAL_USER"))))
                .andExpect(status().isOk())
                .andReturn();
        return body(result).at("/data/token").asText();
    }

    private long wallet(String token, String balance) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/wallets")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of(
                                "walletName", "Ví test",
                                "type", "CASH",
                                "currency", "VND",
                                "balance", balance))))
                .andExpect(status().isOk())
                .andReturn();
        return body(result).at("/data/id").asLong();
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
        return body(result).at("/data/id").asLong();
    }

    private void setBudget(String token, Map<String, Object> fields) throws Exception {
        mvc.perform(post("/api/v1/budgets")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(fields)))
                .andExpect(status().isOk());
    }

    private void spend(String token, long walletId, Long categoryId, String amount) throws Exception {
        var builder = post("/api/v1/transactions")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON);
        var fields = categoryId == null
                ? Map.of("walletId", walletId, "actionTitle", "Chi", "amount", amount, "transactionType", "EXPENSE")
                : Map.of("walletId", walletId, "categoryId", categoryId, "actionTitle", "Chi", "amount", amount, "transactionType", "EXPENSE");
        mvc.perform(builder.content(om.writeValueAsString(fields))).andExpect(status().isOk());
    }

    private MvcResult budgets(String token) throws Exception {
        LocalDateTime now = LocalDateTime.now();
        return mvc.perform(get("/api/v1/budgets")
                        .header("Authorization", "Bearer " + token)
                        .param("month", String.valueOf(now.getMonthValue()))
                        .param("year", String.valueOf(now.getYear())))
                .andExpect(status().isOk())
                .andReturn();
    }

    @Test
    void budgetTracksSpendingThroughWarningAndExceeded() throws Exception {
        String token = register();
        long walletId = wallet(token, "1000000");
        long foodId = category(token, "Ăn uống", "EXPENSE");
        LocalDateTime now = LocalDateTime.now();
        setBudget(token, Map.of(
                "categoryId", foodId,
                "amountLimit", "100000",
                "periodMonth", now.getMonthValue(),
                "periodYear", now.getYear()));

        spend(token, walletId, foodId, "30000");
        assertThat(field(token, 0, "alertLevel").asText()).isEqualTo("OK");
        assertThat(field(token, 0, "spentAmount").decimalValue()).isEqualByComparingTo("30000");

        spend(token, walletId, foodId, "55000");
        assertThat(field(token, 0, "alertLevel").asText()).isEqualTo("WARNING");

        spend(token, walletId, foodId, "20000");
        assertThat(field(token, 0, "alertLevel").asText()).isEqualTo("EXCEEDED");
    }

    private JsonNode field(String token, int index, String name) throws Exception {
        return body(budgets(token)).at("/data/" + index + "/" + name);
    }

    @Test
    void resettingSamePeriodUpdatesInsteadOfDuplicating() throws Exception {
        String token = register();
        long foodId = category(token, "Cà phê", "EXPENSE");
        LocalDateTime now = LocalDateTime.now();
        Map<String, Object> first = Map.of(
                "categoryId", foodId, "amountLimit", "100000",
                "periodMonth", now.getMonthValue(), "periodYear", now.getYear());
        setBudget(token, first);
        setBudget(token, Map.of(
                "categoryId", foodId, "amountLimit", "250000",
                "periodMonth", now.getMonthValue(), "periodYear", now.getYear()));

        JsonNode list = body(budgets(token)).at("/data");
        assertThat(list.size()).isEqualTo(1);
        assertThat(list.at("/0/amountLimit").decimalValue()).isEqualByComparingTo("250000");
    }

    @Test
    void totalBudgetCountsEveryExpenseOfThePeriod() throws Exception {
        String token = register();
        long walletId = wallet(token, "1000000");
        long foodId = category(token, "Ăn", "EXPENSE");
        long travelId = category(token, "Đi lại", "EXPENSE");
        LocalDateTime now = LocalDateTime.now();
        setBudget(token, Map.of(
                "amountLimit", "200000",
                "periodMonth", now.getMonthValue(),
                "periodYear", now.getYear()));

        spend(token, walletId, foodId, "70000");
        spend(token, walletId, travelId, "90000");

        JsonNode data = body(budgets(token)).at("/data");
        assertThat(data.at("/0/spentAmount").decimalValue()).isEqualByComparingTo("160000");
        assertThat(data.at("/0/alertLevel").asText()).isEqualTo("WARNING");
    }

    @Test
    void customThresholdIsStored() throws Exception {
        String token = register();
        long foodId = category(token, "Sở thích", "EXPENSE");
        LocalDateTime now = LocalDateTime.now();

        mvc.perform(post("/api/v1/budgets")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of(
                                "categoryId", foodId,
                                "amountLimit", "100000",
                                "alertThreshold", "50.00",
                                "periodMonth", now.getMonthValue(),
                                "periodYear", now.getYear()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.alertThreshold").value(50.00));
    }

    @Test
    void cannotSetBudgetForIncomeCategory() throws Exception {
        String token = register();
        long salaryId = category(token, "Lương", "INCOME");
        LocalDateTime now = LocalDateTime.now();

        mvc.perform(post("/api/v1/budgets")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of(
                                "categoryId", salaryId,
                                "amountLimit", "100000",
                                "periodMonth", now.getMonthValue(),
                                "periodYear", now.getYear()))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void anotherUserCannotSeeMyBudgets() throws Exception {
        String ownerToken = register();
        long foodId = category(ownerToken, "Ăn của chủ", "EXPENSE");
        LocalDateTime now = LocalDateTime.now();
        setBudget(ownerToken, Map.of(
                "categoryId", foodId, "amountLimit", "100000",
                "periodMonth", now.getMonthValue(), "periodYear", now.getYear()));

        String intruderToken = register();
        assertThat(body(budgets(intruderToken)).at("/data").size()).isZero();
    }

    @Test
    void budgetRequiresAuthentication() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        mvc.perform(get("/api/v1/budgets")
                        .param("month", String.valueOf(now.getMonthValue()))
                        .param("year", String.valueOf(now.getYear())))
                .andExpect(status().isUnauthorized());
    }
}
