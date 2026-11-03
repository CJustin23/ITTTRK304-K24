package com.budglee.finance;

import com.budglee.finance.entity.Role;
import com.budglee.finance.entity.User;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * DUAN-40 — phân quyền trong phạm vi hộ gia đình, dùng đúng hai cột đã có trong lược đồ:
 * users.role và users.family_group_id.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FamilyWorkspaceAccessTest {

    private static final String GROUP_A = "HN-GROUP-A-" ;
    private static final String GROUP_B = "HN-GROUP-B-";

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper om;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static String textOf(MvcResult result) {
        return new String(result.getResponse().getContentAsByteArray(), StandardCharsets.UTF_8);
    }

    private JsonNode json(MvcResult result) throws Exception {
        return om.readTree(textOf(result));
    }

    private String login(String email) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of("email", email, "password", "MatKhau123"))))
                .andExpect(status().isOk())
                .andReturn();
        return json(result).at("/data/token").asText();
    }

    /**
     * Đăng ký qua API rồi đăng nhập. API chỉ cho nhận INDIVIDUAL_USER hoặc FAMILY_MEMBER.
     */
    private String registerAndLogin(Role role, String familyGroupId) throws Exception {
        String email = "fam." + UUID.randomUUID() + "@budglee.dev";
        Map<String, Object> body = new HashMap<>();
        body.put("fullName", "Thành viên " + role);
        body.put("email", email);
        body.put("password", "MatKhau123");
        body.put("role", role.name());
        if (familyGroupId != null) {
            body.put("familyGroupId", familyGroupId);
        }
        mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(body)))
                .andExpect(status().isOk());
        return login(email);
    }

    /**
     * Chủ hộ và quản trị không thể tạo qua API, nên dựng trực tiếp trong CSDL.
     */
    private String createAdminAndLogin(Role role, String familyGroupId) throws Exception {
        String email = "admin." + UUID.randomUUID() + "@budglee.dev";
        userRepository.save(User.builder()
                .fullName("Quản trị " + role)
                .email(email)
                .passwordHash(passwordEncoder.encode("MatKhau123"))
                .role(role)
                .familyGroupId(familyGroupId)
                .build());
        return login(email);
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
        return json(result).at("/data/id").asLong();
    }

    private MvcResult transaction(String token, long walletId, String amount) throws Exception {
        return mvc.perform(post("/api/v1/transactions")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of(
                                "walletId", walletId,
                                "actionTitle", "Chi chung",
                                "amount", amount,
                                "transactionType", "EXPENSE"))))
                .andReturn();
    }

    private JsonNode walletNames(String token) throws Exception {
        MvcResult result = mvc.perform(get("/api/v1/wallets").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        return json(result).at("/data");
    }

    @Test
    void membersOfSameFamilySeeEachOthersWallets() throws Exception {
        String group = GROUP_A + UUID.randomUUID();
        String memberA = registerAndLogin(Role.FAMILY_MEMBER, group);
        String memberB = registerAndLogin(Role.FAMILY_MEMBER, group);

        createWallet(memberA, "Quỹ nhà A", "500000");

        JsonNode walletsOfB = walletNames(memberB);
        assertThat(walletsOfB.toString()).contains("Quỹ nhà A");
    }

    @Test
    void userOutsideTheFamilySeesNothingOfIt() throws Exception {
        String group = GROUP_A + UUID.randomUUID();
        String memberA = registerAndLogin(Role.FAMILY_MEMBER, group);
        createWallet(memberA, "Ví kín của A", "500000");

        String outsider = registerAndLogin(Role.INDIVIDUAL_USER, null);

        assertThat(walletNames(outsider).toString()).doesNotContain("Ví kín của A");
    }

    @Test
    void familyAdminCanRecordTransactionOnMemberWallet() throws Exception {
        String group = GROUP_A + UUID.randomUUID();
        String member = registerAndLogin(Role.FAMILY_MEMBER, group);
        long walletId = createWallet(member, "Ví thành viên", "300000");

        String admin = createAdminAndLogin(Role.FAMILY_ADMIN, group);
        MvcResult result = transaction(admin, walletId, "100000");

        assertThat(result.getResponse().getStatus()).isEqualTo(200);
        assertThat(json(result).at("/data/balanceAfter").decimalValue().intValue()).isEqualTo(200000);
    }

    @Test
    void plainMemberCannotWriteOnAnotherMemberWallet() throws Exception {
        String group = GROUP_A + UUID.randomUUID();
        String memberA = registerAndLogin(Role.FAMILY_MEMBER, group);
        long walletId = createWallet(memberA, "Ví riêng của A", "300000");

        String memberB = registerAndLogin(Role.FAMILY_MEMBER, group);

        assertThat(transaction(memberB, walletId, "100000").getResponse().getStatus()).isEqualTo(404);
        assertThat(walletNames(memberA).toString()).contains("300000");
    }

    @Test
    void familyAdminOfAnotherFamilyCannotWrite() throws Exception {
        String groupA = GROUP_A + UUID.randomUUID();
        String member = registerAndLogin(Role.FAMILY_MEMBER, groupA);
        long walletId = createWallet(member, "Ví hộ A", "300000");

        String adminOfB = createAdminAndLogin(Role.FAMILY_ADMIN, GROUP_B + UUID.randomUUID());

        assertThat(transaction(adminOfB, walletId, "100000").getResponse().getStatus()).isEqualTo(404);
    }

    @Test
    void familyCategoriesAreVisibleButNotEditable() throws Exception {
        String group = GROUP_A + UUID.randomUUID();
        String memberA = registerAndLogin(Role.FAMILY_MEMBER, group);
        String memberB = registerAndLogin(Role.FAMILY_MEMBER, group);

        MvcResult created = mvc.perform(post("/api/v1/categories")
                        .header("Authorization", "Bearer " + memberA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of("name", "Tiền điện chung", "type", "EXPENSE"))))
                .andExpect(status().isOk())
                .andReturn();
        long categoryId = json(created).at("/data/id").asLong();

        MvcResult listForB = mvc.perform(get("/api/v1/categories").header("Authorization", "Bearer " + memberB))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(textOf(listForB)).contains("Tiền điện chung");

        mvc.perform(put("/api/v1/categories/" + categoryId)
                        .header("Authorization", "Bearer " + memberB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of("name", "B đổi tên", "type", "EXPENSE"))))
                .andExpect(status().isNotFound());
    }

    @Test
    void individualUserWithoutFamilyStillSeesOnlyOwnData() throws Exception {
        String solo = registerAndLogin(Role.INDIVIDUAL_USER, null);
        createWallet(solo, "Ví của tôi", "100000");

        JsonNode wallets = walletNames(solo);
        assertThat(wallets.size()).isEqualTo(1);
        assertThat(wallets.at("/0/walletName").asText()).isEqualTo("Ví của tôi");
    }
}
