package com.budglee.finance;

import com.budglee.finance.entity.Category;
import com.budglee.finance.entity.CategoryType;
import com.budglee.finance.entity.Role;
import com.budglee.finance.entity.User;
import com.budglee.finance.repository.CategoryRepository;
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

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * DUAN-49 + DUAN-40 — sửa/xoá danh mục và phân quyền theo vai trò.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CategoryCrudFlowTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper om;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static String textOf(MvcResult result) {
        return new String(result.getResponse().getContentAsByteArray(), StandardCharsets.UTF_8);
    }

    private JsonNode json(MvcResult result) throws Exception {
        return om.readTree(textOf(result));
    }

    private String loginNewUser() throws Exception {
        String email = "cat." + UUID.randomUUID() + "@budglee.dev";
        Map<String, Object> register = new HashMap<>();
        register.put("fullName", "Người quản lý danh mục");
        register.put("email", email);
        register.put("password", "MatKhau123");
        mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(register)))
                .andExpect(status().isOk());

        MvcResult login = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of("email", email, "password", "MatKhau123"))))
                .andExpect(status().isOk())
                .andReturn();
        return json(login).at("/data/token").asText();
    }

    /**
     * Tài khoản quản trị không thể tạo qua API (đăng ký đã khoá vai trò đặc quyền),
     * nên dựng trực tiếp trong CSDL đúng như cách vận hành thật sẽ làm.
     */
    private String loginAsSystemAdmin() throws Exception {
        String email = "admin." + UUID.randomUUID() + "@budglee.dev";
        userRepository.save(User.builder()
                .fullName("Quản trị hệ thống")
                .email(email)
                .passwordHash(passwordEncoder.encode("MatKhau123"))
                .role(Role.SYSTEM_ADMIN)
                .build());

        MvcResult login = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of("email", email, "password", "MatKhau123"))))
                .andExpect(status().isOk())
                .andReturn();
        return json(login).at("/data/token").asText();
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

    private long createSystemCategory() {
        return categoryRepository.save(Category.builder()
                .name("Tiền điện hệ thống")
                .type(CategoryType.EXPENSE)
                .icon("bolt")
                .colorCode("#F59E0B")
                .build()).getId();
    }

    private Map<String, Object> body(String name, CategoryType type, String icon, String color) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("name", name);
        payload.put("type", type.name());
        payload.put("icon", icon);
        payload.put("colorCode", color);
        return payload;
    }

    private MvcResult update(String token, long id, Map<String, Object> payload) throws Exception {
        return mvc.perform(put("/api/v1/categories/" + id)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(payload)))
                .andReturn();
    }

    private Optional<Category> find(long id) {
        return categoryRepository.findById(id);
    }

    @Test
    void ownerCanRenameItsOwnCategory() throws Exception {
        String token = loginNewUser();
        long id = createCategory(token, "Ăn uống");

        MvcResult result = update(token, id, body("  Ăn uống hằng ngày  ", CategoryType.EXPENSE, "utensils", "#EF4444"));

        assertThat(result.getResponse().getStatus()).isEqualTo(200);
        assertThat(find(id).orElseThrow().getName()).isEqualTo("Ăn uống hằng ngày");
        assertThat(find(id).orElseThrow().getColorCode()).isEqualTo("#EF4444");
    }

    @Test
    void changingCategoryTypeIsRejected() throws Exception {
        String token = loginNewUser();
        long id = createCategory(token, "Lương phụ");

        MvcResult result = update(token, id, body("Lương phụ", CategoryType.INCOME, "wallet", "#22C55E"));

        assertThat(result.getResponse().getStatus()).isEqualTo(400);
        assertThat(json(result).at("/message").asText()).contains("Không thể đổi loại");
        assertThat(find(id).orElseThrow().getType()).isEqualTo(CategoryType.EXPENSE);
    }

    @Test
    void blankNameFailsValidation() throws Exception {
        String token = loginNewUser();
        long id = createCategory(token, "Danh mục test");

        assertThat(update(token, id, body("", CategoryType.EXPENSE, "utensils", "#22C55E"))
                .getResponse().getStatus()).isEqualTo(400);
    }

    @Test
    void ownerCanDeleteUnusedCategory() throws Exception {
        String token = loginNewUser();
        long id = createCategory(token, "Tạm bỏ");

        MvcResult result = mvc.perform(delete("/api/v1/categories/" + id)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        assertThat(json(result).at("/success").asBoolean()).isTrue();
        assertThat(find(id)).isEmpty();
    }

    @Test
    void categoryWithTransactionsCannotBeDeleted() throws Exception {
        String token = loginNewUser();
        long categoryId = createCategory(token, "Đã dùng để chi");
        MvcResult wallet = mvc.perform(post("/api/v1/wallets")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of(
                                "walletName", "Ví chi",
                                "type", "CASH",
                                "currency", "VND",
                                "balance", "500000"))))
                .andExpect(status().isOk())
                .andReturn();
        long walletId = json(wallet).at("/data/id").asLong();

        mvc.perform(post("/api/v1/transactions")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of(
                                "walletId", walletId,
                                "categoryId", categoryId,
                                "actionTitle", "Cơm",
                                "amount", "50000",
                                "transactionType", "EXPENSE"))))
                .andExpect(status().isOk());

        MvcResult blocked = mvc.perform(delete("/api/v1/categories/" + categoryId)
                        .header("Authorization", "Bearer " + token))
                .andReturn();

        assertThat(blocked.getResponse().getStatus()).isEqualTo(400);
        assertThat(json(blocked).at("/message").asText()).contains("đã có giao dịch");
        assertThat(find(categoryId)).isPresent();
    }

    @Test
    void anotherUserCannotTouchMyCategory() throws Exception {
        String ownerToken = loginNewUser();
        long categoryId = createCategory(ownerToken, "Của chủ");

        String intruderToken = loginNewUser();
        MvcResult updated = update(intruderToken, categoryId,
                body("Đổi trộm", CategoryType.EXPENSE, "hack", "#000000"));
        MvcResult deleted = mvc.perform(delete("/api/v1/categories/" + categoryId)
                .header("Authorization", "Bearer " + intruderToken)).andReturn();

        assertThat(updated.getResponse().getStatus()).isEqualTo(404);
        assertThat(deleted.getResponse().getStatus()).isEqualTo(404);
        assertThat(find(categoryId).orElseThrow().getName()).isEqualTo("Của chủ");
    }

    @Test
    void systemCategoryIsReadOnlyForNormalUsers() throws Exception {
        long systemCategoryId = createSystemCategory();
        String userToken = loginNewUser();

        MvcResult updated = update(userToken, systemCategoryId,
                body("Đổi tên danh mục hệ thống", CategoryType.EXPENSE, "bolt", "#111111"));
        MvcResult deleted = mvc.perform(delete("/api/v1/categories/" + systemCategoryId)
                .header("Authorization", "Bearer " + userToken)).andReturn();

        assertThat(updated.getResponse().getStatus()).isEqualTo(403);
        assertThat(deleted.getResponse().getStatus()).isEqualTo(403);
        assertThat(find(systemCategoryId).orElseThrow().getName()).isEqualTo("Tiền điện hệ thống");
    }

    @Test
    void systemAdminCanEditSystemCategory() throws Exception {
        long systemCategoryId = createSystemCategory();
        String adminToken = loginAsSystemAdmin();

        MvcResult result = update(adminToken, systemCategoryId,
                body("Tiền điện", CategoryType.EXPENSE, "bolt", "#F59E0B"));

        assertThat(result.getResponse().getStatus()).isEqualTo(200);
        assertThat(find(systemCategoryId).orElseThrow().getName()).isEqualTo("Tiền điện");
    }

    @Test
    void unknownCategoryReturnsNotFound() throws Exception {
        String token = loginNewUser();

        assertThat(update(token, 987654, body("Không tồn tại", CategoryType.EXPENSE, "x", "#000000"))
                .getResponse().getStatus()).isEqualTo(404);
    }

    @Test
    void anonymousCannotEditOrDelete() throws Exception {
        String token = loginNewUser();
        long categoryId = createCategory(token, "Danh mục ẩn danh");

        mvc.perform(put("/api/v1/categories/" + categoryId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(body("Đổi ẩn danh", CategoryType.EXPENSE, "x", "#000000"))))
                .andExpect(status().isUnauthorized());

        mvc.perform(delete("/api/v1/categories/" + categoryId))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void postingAnotherUsersIdCreatesANewCategoryInsteadOfHijacking() throws Exception {
        String ownerToken = loginNewUser();
        long ownerCategoryId = createCategory(ownerToken, "Của chủ");

        String attackerToken = loginNewUser();
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", ownerCategoryId);
        payload.put("name", "Kẻ gian chiếm");
        payload.put("type", "EXPENSE");

        MvcResult result = mvc.perform(post("/api/v1/categories")
                        .header("Authorization", "Bearer " + attackerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andReturn();

        long createdId = json(result).at("/data/id").asLong();
        long attackerId = json(result).at("/data/user/id").asLong();

        Category untouched = find(ownerCategoryId).orElseThrow();
        assertThat(createdId).as("không được ghi đè bản ghi của người khác").isNotEqualTo(ownerCategoryId);
        assertThat(untouched.getName()).isEqualTo("Của chủ");
        assertThat(untouched.getUser().getId()).as("chủ sở hữu cũ không bị đổi").isNotEqualTo(attackerId);
        assertThat(find(createdId).orElseThrow().getUser().getId()).isEqualTo(attackerId);
    }

    @Test
    void createRejectsBlankAndOversizedPayloads() throws Exception {
        String token = loginNewUser();

        mvc.perform(post("/api/v1/categories")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());

        mvc.perform(post("/api/v1/categories")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of("name", "A".repeat(120), "type", "EXPENSE"))))
                .andExpect(status().isBadRequest());
    }
}
