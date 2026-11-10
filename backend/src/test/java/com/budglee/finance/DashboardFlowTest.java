package com.budglee.finance;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.budglee.finance.config.RedisConfig;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.Cache;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * =========================================================================
 * KIỂM THỬ TÍCH HỢP CHO DASHBOARD API & REDIS FALLBACK (DUAN-42)
 * Phụ trách: Nguyễn Tiến Thành
 * =========================================================================
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DashboardFlowTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper om;

    @Autowired
    private RedisConfig redisConfig;

    private static String textOf(MvcResult result) {
        return new String(result.getResponse().getContentAsByteArray(), StandardCharsets.UTF_8);
    }

    private JsonNode json(MvcResult result) throws Exception {
        return om.readTree(textOf(result));
    }

    private String loginNewUser() throws Exception {
        String email = "dashboard." + UUID.randomUUID() + "@budglee.dev";
        mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of(
                                "fullName", "Nguyễn Tiến Thành Test",
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

    @Test
    @DisplayName("DUAN-42: Truy cập /dashboard/summary khi chưa đăng nhập trả về 401 Unauthorized")
    void getDashboardSummary_Unauthenticated_Returns401() throws Exception {
        mvc.perform(get("/api/v1/dashboard/summary"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("DUAN-42: Lấy dữ liệu Dashboard Summary thành công qua HTTP trả 200 OK với cấu trúc chuẩn")
    void getDashboardSummary_Authenticated_Returns200WithData() throws Exception {
        String token = loginNewUser();

        MvcResult result = mvc.perform(get("/api/v1/dashboard/summary")
                        .header("Authorization", "Bearer " + token)
                        .param("year", "2026")
                        .param("month", "11"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = json(result);
        assertThat(result.getResponse().getStatus()).isEqualTo(200);
        assertThat(body.at("/success").asBoolean()).isTrue();
        assertThat(body.at("/message").asText()).isEqualTo("Lấy dữ liệu Dashboard thành công");

        JsonNode data = body.at("/data");
        assertThat(data.has("totalBalance")).isTrue();
        assertThat(data.has("monthlyIncome")).isTrue();
        assertThat(data.has("monthlySpending")).isTrue();
        assertThat(data.has("leftToSpend")).isTrue();
        assertThat(data.has("spendingPercentageOfBudget")).isTrue();
        assertThat(data.has("categoryExpenses")).isTrue();
        assertThat(data.has("spentTrends")).isTrue();
    }

    @Test
    @DisplayName("DUAN-42: Lấy dữ liệu biểu đồ dòng tiền theo kỳ /dashboard/trends trả 200 OK")
    void getCashFlowTrends_Authenticated_Returns200WithPoints() throws Exception {
        String token = loginNewUser();

        MvcResult result = mvc.perform(get("/api/v1/dashboard/trends")
                        .header("Authorization", "Bearer " + token)
                        .param("timeframe", "MONTHLY"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = json(result);
        assertThat(result.getResponse().getStatus()).isEqualTo(200);
        assertThat(body.at("/success").asBoolean()).isTrue();
        assertThat(body.at("/data").isArray()).isTrue();
        assertThat(body.at("/data").size()).isGreaterThan(0);
    }

    @Test
    @DisplayName("Lấy dữ liệu Điểm sức khỏe tài chính /dashboard/financial-health trả 200 OK")
    void getFinancialHealth_Authenticated_Returns200WithData() throws Exception {
        String token = loginNewUser();

        MvcResult result = mvc.perform(get("/api/v1/dashboard/financial-health")
                        .header("Authorization", "Bearer " + token)
                        .param("year", "2026")
                        .param("month", "11"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = json(result);
        assertThat(result.getResponse().getStatus()).isEqualTo(200);
        assertThat(body.at("/success").asBoolean()).isTrue();
        assertThat(body.at("/message").asText()).isEqualTo("Tính toán điểm sức khỏe tài chính thành công");

        JsonNode data = body.at("/data");
        assertThat(data.has("score")).isTrue();
        assertThat(data.has("rating")).isTrue();
        assertThat(data.has("ratingLabel")).isTrue();
        assertThat(data.has("breakdown")).isTrue();
        assertThat(data.has("advice")).isTrue();
    }

    @Test
    @DisplayName("DUAN-42 (Redis Error 500 Fix): CacheErrorHandler bắt ngoại lệ Redis và không re-throw giúp API không bị lỗi 500")
    void redisCacheErrorHandler_CatchesAndSuppressesRedisErrors() {
        CacheErrorHandler errorHandler = redisConfig.errorHandler();
        assertThat(errorHandler).isNotNull();

        Cache mockCache = mock(Cache.class);
        when(mockCache.getName()).thenReturn("dashboardSummary");

        RedisConnectionFailureException redisEx = new RedisConnectionFailureException("Không thể kết nối tới Redis standalone:6379");

        // Đảm bảo không ném exception ra ngoài khi Redis bị sập
        assertThatCode(() -> errorHandler.handleCacheGetError(redisEx, mockCache, "user_1_2026_11"))
                .doesNotThrowAnyException();

        assertThatCode(() -> errorHandler.handleCachePutError(redisEx, mockCache, "user_1_2026_11", "dummy_val"))
                .doesNotThrowAnyException();

        assertThatCode(() -> errorHandler.handleCacheEvictError(redisEx, mockCache, "user_1_2026_11"))
                .doesNotThrowAnyException();

        assertThatCode(() -> errorHandler.handleCacheClearError(redisEx, mockCache))
                .doesNotThrowAnyException();
    }
}

