package com.budglee.finance;

import com.budglee.finance.config.SystemAdminBootstrap;
import com.budglee.finance.entity.Role;
import com.budglee.finance.entity.User;
import com.budglee.finance.repository.FamilyGroupRepository;
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
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

/**
 * DUAN-40 — RBAC theo role: ai được gán vai trò, yêu cầu không đủ quyền bị chặn ở đâu,
 * và cấp/thu hồi có hiệu lực ngay trên token đã phát hành hay không.
 * FamilyWorkspaceAccessTest mới phủ phân quyền theo hộ gia đình; ở đây là phủ role,
 * kể cả SystemAdminBootstrap — cách duy nhất để một CSDL demo có SYSTEM_ADMIN đầu tiên.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RbacAdminAccessTest {

    private static final String PASSWORD = "MatKhau123";
    private static final String ADMIN_API = "/api/v1/admin/users";
    private static final String ADMIN_GROUPS = "/api/v1/admin/family-groups";

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper om;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FamilyGroupRepository familyGroupRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private record Account(String email, String token) {
    }

    private String textOf(MvcResult result) {
        return new String(result.getResponse().getContentAsByteArray(), StandardCharsets.UTF_8);
    }

    private JsonNode json(MvcResult result) throws Exception {
        return om.readTree(textOf(result));
    }

    private JsonNode data(MvcResult result) throws Exception {
        return json(result).at("/data");
    }

    private String login(String email) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of("email", email, "password", PASSWORD))))
                .andReturn();
        return data(result).at("/token").asText();
    }

    private Account register(Role role, String familyGroupId) throws Exception {
        String email = "rbac." + UUID.randomUUID() + "@budglee.dev";
        Map<String, Object> body = new HashMap<>();
        body.put("fullName", "Thành viên " + role);
        body.put("email", email);
        body.put("password", PASSWORD);
        body.put("role", role.name());
        if (familyGroupId != null) {
            body.put("familyGroupId", familyGroupId);
        }
        mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(body)))
                .andReturn();
        return new Account(email, login(email));
    }

    /**
     * Vai trò đặc quyền không đăng ký qua API được (DUAN-39), nên dựng thẳng trong CSDL rồi lấy token.
     */
    private Account createAccount(Role role, String familyGroupId) throws Exception {
        String email = "rbac." + role.name().toLowerCase() + "." + UUID.randomUUID() + "@budglee.dev";
        userRepository.save(User.builder()
                .fullName("Quản trị " + role)
                .email(email)
                .passwordHash(passwordEncoder.encode(PASSWORD))
                .role(role)
                .familyGroupId(familyGroupId)
                .build());
        return new Account(email, login(email));
    }

    private long idOf(Account account) {
        return userRepository.findByEmail(account.email()).orElseThrow().getId();
    }

    private MvcResult call(String method, String path, Account actor, Map<String, Object> body) throws Exception {
        MockHttpServletRequestBuilder request = switch (method) {
            case "GET" -> get(path);
            case "PUT" -> put(path);
            default -> post(path);
        };
        if (actor != null) {
            request = request.header("Authorization", "Bearer " + actor.token());
        }
        if (body != null) {
            request = request.contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsString(body));
        }
        return mvc.perform(request).andReturn();
    }

    private MvcResult assignRole(Account admin, long targetId, Role role, String familyGroupId) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("role", role.name());
        if (familyGroupId != null) {
            body.put("familyGroupId", familyGroupId);
        }
        return call("PUT", ADMIN_API + "/" + targetId + "/role", admin, body);
    }

    private long createWallet(Account owner, String name, String balance) throws Exception {
        MvcResult result = call("POST", "/api/v1/wallets", owner,
                Map.of("walletName", name, "type", "CASH", "currency", "VND", "balance", balance));
        return data(result).at("/id").asLong();
    }

    private MvcResult transaction(Account actor, long walletId) throws Exception {
        return call("POST", "/api/v1/transactions", actor, Map.of(
                "walletId", walletId,
                "actionTitle", "Chi chung",
                "amount", "100000",
                "transactionType", "EXPENSE"));
    }

    private String walletList(Account actor) throws Exception {
        return data(call("GET", "/api/v1/wallets", actor, null)).toString();
    }

    /**
     * Gom SYSTEM_ADMIN về đúng một tài khoản để test "admin cuối cùng" không phụ thuộc dữ liệu
     * mà các test khác để lại trên cùng H2 in-memory.
     */
    private void keepOnlyThisAdmin(long adminId) {
        userRepository.findAll().stream()
                .filter(user -> user.getRole() == Role.SYSTEM_ADMIN && !user.getId().equals(adminId))
                .forEach(user -> {
                    user.setRole(Role.INDIVIDUAL_USER);
                    userRepository.save(user);
                });
    }

    @Test
    void anonymousRequestToAdminApiGetsUnauthorizedEnvelope() throws Exception {
        MvcResult result = call("GET", ADMIN_API, null, null);

        assertThat(result.getResponse().getStatus()).isEqualTo(401);
        JsonNode body = json(result);
        assertThat(body.at("/success").asBoolean()).isFalse();
        assertThat(body.at("/message").asText()).isNotBlank();
        assertThat(body.has("error")).as("phải là envelop ApiResponse, không phải white-label của Spring").isFalse();
    }

    @Test
    void userWithoutAdminRoleIsRejectedWithForbiddenEnvelope() throws Exception {
        Account plain = register(Role.INDIVIDUAL_USER, null);

        MvcResult result = call("GET", ADMIN_API, plain, null);

        assertThat(result.getResponse().getStatus()).isEqualTo(403);
        assertThat(json(result).at("/success").asBoolean()).isFalse();
        assertThat(textOf(result)).doesNotContain("passwordHash");
    }

    @Test
    void familyAdminCannotManageRoles() throws Exception {
        Account familyAdmin = createAccount(Role.FAMILY_ADMIN, newGroup("HN-RBAC-" + UUID.randomUUID()));

        assertThat(call("GET", ADMIN_API, familyAdmin, null).getResponse().getStatus()).isEqualTo(403);
        assertThat(assignRole(familyAdmin, 1L, Role.SYSTEM_ADMIN, null).getResponse().getStatus()).isEqualTo(403);
        assertThat(call("POST", ADMIN_GROUPS, familyAdmin,
                Map.of("id", "HN-TRAI-" + UUID.randomUUID(), "name", "Nhóm trái phép", "ownerId", 1L))
                .getResponse().getStatus()).isEqualTo(403);
    }

    @Test
    void grantedFamilyAdminWritesOnMemberWalletWithTheOldToken() throws Exception {
        String group = newGroup("HN-RBAC-" + UUID.randomUUID());
        Account member = register(Role.FAMILY_MEMBER, group);
        long walletId = createWallet(member, "Ví hộ RBAC", "300000");
        Account newcomer = register(Role.FAMILY_MEMBER, group);

        assertThat(transaction(newcomer, walletId).getResponse().getStatus())
                .as("thành viên thường không được ghi ví của người khác").isEqualTo(404);

        Account systemAdmin = createAccount(Role.SYSTEM_ADMIN, null);
        MvcResult granted = assignRole(systemAdmin, idOf(newcomer), Role.FAMILY_ADMIN, group);

        assertThat(granted.getResponse().getStatus()).isEqualTo(200);
        assertThat(data(granted).at("/role").asText()).isEqualTo("FAMILY_ADMIN");
        assertThat(transaction(newcomer, walletId).getResponse().getStatus())
                .as("phân quyền đọc từ CSDL mỗi request nên vai trò mới có hiệu lực ngay").isEqualTo(200);
    }

    @Test
    void revokedFamilyRoleStopsSeeingTheSharedWallets() throws Exception {
        String group = newGroup("HN-RBAC-" + UUID.randomUUID());
        Account owner = register(Role.FAMILY_MEMBER, group);
        createWallet(owner, "Ví quỹ chung", "500000");
        Account member = register(Role.FAMILY_MEMBER, group);
        assertThat(walletList(member)).contains("Ví quỹ chung");

        Account systemAdmin = createAccount(Role.SYSTEM_ADMIN, null);
        MvcResult revoked = assignRole(systemAdmin, idOf(member), Role.INDIVIDUAL_USER, null);

        assertThat(revoked.getResponse().getStatus()).isEqualTo(200);
        assertThat(data(revoked).at("/familyGroupId").isNull())
                .as("rời khỏi hộ thì mã nhóm hộ phải bị xoá").isTrue();
        assertThat(walletList(member)).doesNotContain("Ví quỹ chung");
    }

    @Test
    void familyRoleCannotBeGrantedWithoutGroupCode() throws Exception {
        Account systemAdmin = createAccount(Role.SYSTEM_ADMIN, null);
        Account target = register(Role.INDIVIDUAL_USER, null);

        MvcResult result = assignRole(systemAdmin, idOf(target), Role.FAMILY_ADMIN, null);

        assertThat(result.getResponse().getStatus()).isEqualTo(400);
        assertThat(userRepository.findById(idOf(target)).orElseThrow().getRole()).isEqualTo(Role.INDIVIDUAL_USER);
    }

    @Test
    void lastSystemAdminCannotBeDemoted() throws Exception {
        Account systemAdmin = createAccount(Role.SYSTEM_ADMIN, null);
        long adminId = idOf(systemAdmin);
        keepOnlyThisAdmin(adminId);

        MvcResult result = assignRole(systemAdmin, adminId, Role.INDIVIDUAL_USER, null);

        assertThat(result.getResponse().getStatus()).isEqualTo(400);
        assertThat(userRepository.findById(adminId).orElseThrow().getRole()).isEqualTo(Role.SYSTEM_ADMIN);
    }

    @Test
    void bootstrapCreatesTheFirstSystemAdminAndThatAdminCanGrantRoles() throws Exception {
        String email = "rbac.bootstrap." + UUID.randomUUID() + "@budglee.dev";

        new SystemAdminBootstrap(userRepository, passwordEncoder, email.toUpperCase(Locale.ROOT), PASSWORD)
                .run(null);

        assertThat(userRepository.findByEmail(email)).as("email cấu hình phải được lưu chữ thường").isPresent();
        Account admin = new Account(email, login(email));
        assertThat(call("GET", ADMIN_API, admin, null).getResponse().getStatus()).isEqualTo(200);

        Account member = register(Role.FAMILY_MEMBER, newGroup("HN-RBAC-" + UUID.randomUUID()));
        assertThat(assignRole(admin, idOf(member), Role.FAMILY_ADMIN, memberGroup(member)).getResponse().getStatus())
                .isEqualTo(200);
    }

    @Test
    void bootstrapDoesNothingWhenPropertiesAreBlank() throws Exception {
        long before = userRepository.count();

        new SystemAdminBootstrap(userRepository, passwordEncoder, "", "").run(null);

        assertThat(userRepository.count()).isEqualTo(before);
    }

    @Test
    void bootstrapRefusesToCreateAdminWithAWeakPassword() throws Exception {
        String email = "rbac.weak." + UUID.randomUUID() + "@budglee.dev";
        long before = userRepository.count();

        new SystemAdminBootstrap(userRepository, passwordEncoder, email, "123").run(null);

        assertThat(userRepository.count()).isEqualTo(before);
        assertThat(userRepository.findByEmail(email)).isEmpty();
    }

    private String memberGroup(Account account) {
        return userRepository.findByEmail(account.email()).orElseThrow().getFamilyGroupId();
    }

    private String newGroup(String code) {
        FamilyGroupTestData.newGroup(familyGroupRepository, userRepository, code);
        return code;
    }

    private MvcResult registerRaw(Map<String, Object> body) throws Exception {
        return mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(body)))
                .andReturn();
    }

    @Test
    void adminCreatesFamilyGroupAndItsOwnerCanUseTheInvitationApi() throws Exception {
        Account systemAdmin = createAccount(Role.SYSTEM_ADMIN, null);
        Account owner = register(Role.INDIVIDUAL_USER, null);
        Account outsider = register(Role.INDIVIDUAL_USER, null);
        String code = "HN-GROUP-" + UUID.randomUUID();

        MvcResult created = call("POST", ADMIN_GROUPS, systemAdmin,
                Map.of("id", code, "name", "Hộ demo", "ownerId", idOf(owner)));

        assertThat(created.getResponse().getStatus()).isEqualTo(200);
        assertThat(data(created).at("/createdBy/role").asText()).isEqualTo("FAMILY_ADMIN");
        assertThat(data(created).at("/createdBy/familyGroupId").asText()).isEqualTo(code);

        MvcResult members = call("GET", "/api/v1/family/members", owner, null);
        assertThat(members.getResponse().getStatus())
                .as("FamilyService bắt chủ hộ đúng là người tạo nhóm; token cũ phải mang vai trò mới").isEqualTo(200);

        assertThat(call("POST", "/api/v1/family/invitations", owner, Map.of("email", outsider.email()))
                .getResponse().getStatus()).isEqualTo(200);
    }

    @Test
    void registrationWithUnknownFamilyGroupCodeIsRejectedBeforeTheDatabase() throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("fullName", "Người đăng ký");
        body.put("email", "rbac.group." + UUID.randomUUID() + "@budglee.dev");
        body.put("password", PASSWORD);
        body.put("role", Role.FAMILY_MEMBER.name());
        body.put("familyGroupId", "KHONG-TON-TAI-" + UUID.randomUUID());

        MvcResult result = registerRaw(body);

        assertThat(result.getResponse().getStatus())
                .as("V4 ràng buộc khoá ngoại nên mã lạ phải thành 400, không phải 500").isEqualTo(400);
        assertThat(json(result).at("/message").asText()).contains("Mã nhóm hộ không tồn tại");
    }

    @Test
    void registrationWithKnownFamilyGroupCodeSucceeds() throws Exception {
        Account systemAdmin = createAccount(Role.SYSTEM_ADMIN, null);
        Account owner = register(Role.INDIVIDUAL_USER, null);
        String code = "HN-GROUP-" + UUID.randomUUID();
        assertThat(call("POST", ADMIN_GROUPS, systemAdmin,
                Map.of("id", code, "name", "Hộ để đăng ký", "ownerId", idOf(owner))).getResponse().getStatus())
                .isEqualTo(200);

        Account member = register(Role.FAMILY_MEMBER, code);

        assertThat(member.token()).startsWith("eyJ");
        assertThat(userRepository.findByEmail(member.email()).orElseThrow().getFamilyGroupId()).isEqualTo(code);
    }

    @Test
    void publicFamilyOwnerRegistrationCreatesAnOwnedGroupAndCanLogInWithRealJwt() throws Exception {
        String email = "family.owner." + UUID.randomUUID() + "@budglee.dev";
        MvcResult registered = mvc.perform(post("/api/v1/auth/register/family-owner")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("fullName", "Chủ hộ mới", "email", email,
                        "password", PASSWORD, "familyName", "Nhà mới")))).andReturn();

        assertThat(registered.getResponse().getStatus()).isEqualTo(200);
        User owner = userRepository.findByEmail(email).orElseThrow();
        assertThat(owner.getRole()).isEqualTo(Role.FAMILY_ADMIN);
        assertThat(owner.getFamilyGroupId()).isNotBlank();
        assertThat(familyGroupRepository.findById(owner.getFamilyGroupId())).isPresent();
        Account authenticated = new Account(email, login(email));
        assertThat(authenticated.token()).startsWith("eyJ");
        assertThat(call("GET", "/api/v1/family/members", authenticated, null).getResponse().getStatus()).isEqualTo(200);
    }

    @Test
    void familyGroupCodeCannotBeReused() throws Exception {
        Account systemAdmin = createAccount(Role.SYSTEM_ADMIN, null);
        Account firstOwner = register(Role.INDIVIDUAL_USER, null);
        Account secondOwner = register(Role.INDIVIDUAL_USER, null);
        String code = "HN-GROUP-" + UUID.randomUUID();

        assertThat(call("POST", ADMIN_GROUPS, systemAdmin,
                Map.of("id", code, "name", "Nhóm thứ nhất", "ownerId", idOf(firstOwner))).getResponse().getStatus())
                .isEqualTo(200);

        assertThat(call("POST", ADMIN_GROUPS, systemAdmin,
                Map.of("id", code, "name", "Nhóm trùng mã", "ownerId", idOf(secondOwner))).getResponse().getStatus())
                .isEqualTo(409);
    }

    @Test
    void adminCannotAssignAFamilyRoleWithAnUnknownGroupCode() throws Exception {
        Account systemAdmin = createAccount(Role.SYSTEM_ADMIN, null);
        Account target = register(Role.INDIVIDUAL_USER, null);

        MvcResult result = assignRole(systemAdmin, idOf(target), Role.FAMILY_ADMIN, "KHONG-CO-" + UUID.randomUUID());

        assertThat(result.getResponse().getStatus()).isEqualTo(400);
        assertThat(userRepository.findById(idOf(target)).orElseThrow().getRole()).isEqualTo(Role.INDIVIDUAL_USER);
    }

    @Test
    void someoneAlreadyInAGroupCannotOwnANewOne() throws Exception {
        Account systemAdmin = createAccount(Role.SYSTEM_ADMIN, null);
        Account owner = register(Role.INDIVIDUAL_USER, null);
        String firstCode = "HN-GROUP-" + UUID.randomUUID();
        call("POST", ADMIN_GROUPS, systemAdmin, Map.of("id", firstCode, "name", "Nhóm một", "ownerId", idOf(owner)));

        MvcResult result = call("POST", ADMIN_GROUPS, systemAdmin,
                Map.of("id", "HN-GROUP-" + UUID.randomUUID(), "name", "Nhóm hai", "ownerId", idOf(owner)));

        assertThat(result.getResponse().getStatus()).isEqualTo(400);
        assertThat(memberGroup(owner)).isEqualTo(firstCode);
    }

    @Test
    void systemAdminCannotOwnAFamilyGroup() throws Exception {
        Account systemAdmin = createAccount(Role.SYSTEM_ADMIN, null);

        MvcResult result = call("POST", ADMIN_GROUPS, systemAdmin,
                Map.of("id", "HN-GROUP-" + UUID.randomUUID(), "name", "Nhóm của admin", "ownerId", idOf(systemAdmin)));

        assertThat(result.getResponse().getStatus()).isEqualTo(400);
    }

    // --- DUAN-40: khoa tai khoan (V13) ---

    private MvcResult setStatus(Account admin, long targetId, boolean enabled) throws Exception {
        return call("PUT", ADMIN_API + "/" + targetId + "/status", admin, Map.of("enabled", enabled));
    }

    @Test
    void disabledAccountLosesAccessWithTheTokenItAlreadyHolds() throws Exception {
        Account systemAdmin = createAccount(Role.SYSTEM_ADMIN, null);
        Account member = register(Role.INDIVIDUAL_USER, null);
        createWallet(member, "Ví của thành viên", "100000");
        assertThat(walletList(member)).contains("Ví của thành viên");

        MvcResult disabled = setStatus(systemAdmin, idOf(member), false);

        assertThat(disabled.getResponse().getStatus()).isEqualTo(200);
        assertThat(data(disabled).at("/enabled").asBoolean()).isFalse();
        assertThat(walletList(member))
                .as("token còn hạn nhưng CSDL báo tài khoản đã tắt thì phải từ chối ngay")
                .doesNotContain("Ví của thành viên");
        assertThat(call("GET", "/api/v1/wallets", member, null).getResponse().getStatus()).isEqualTo(401);

        MvcResult relogin = mvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("email", member.email(), "password", PASSWORD)))).andReturn();
        assertThat(relogin.getResponse().getStatus())
                .as("tài khoản bị khoá phải nói rõ là bị khoá, không phải sai mật khẩu")
                .isEqualTo(403);
        assertThat(json(relogin).at("/message").asText()).contains("khoá");
    }

    @Test
    void enabledAccountWorksAgainThroughTheSameApi() throws Exception {
        Account systemAdmin = createAccount(Role.SYSTEM_ADMIN, null);
        Account member = register(Role.INDIVIDUAL_USER, null);
        long memberId = idOf(member);
        createWallet(member, "Ví chờ mở", "50000");
        setStatus(systemAdmin, memberId, false);

        assertThat(setStatus(systemAdmin, memberId, true).getResponse().getStatus()).isEqualTo(200);

        Account reopened = new Account(member.email(), login(member.email()));
        assertThat(reopened.token()).startsWith("eyJ");
        assertThat(walletList(reopened)).contains("Ví chờ mở");
    }

    @Test
    void adminCannotDisableItsOwnAccount() throws Exception {
        Account systemAdmin = createAccount(Role.SYSTEM_ADMIN, null);

        MvcResult result = setStatus(systemAdmin, idOf(systemAdmin), false);

        assertThat(result.getResponse().getStatus())
                .as("tắt chính mình là cách nhanh nhất để không ai mở lại được nữa").isEqualTo(400);
        assertThat(userRepository.findById(idOf(systemAdmin)).orElseThrow().getEnabled()).isTrue();
    }

    @Test
    void disabledAdminCanBeDemotedBecauseItNoLongerHoldsPower() throws Exception {
        Account systemAdmin = createAccount(Role.SYSTEM_ADMIN, null);
        Account staleAdmin = createAccount(Role.SYSTEM_ADMIN, null);
        long staleId = idOf(staleAdmin);
        assertThat(setStatus(systemAdmin, staleId, false).getResponse().getStatus()).isEqualTo(200);

        MvcResult result = assignRole(systemAdmin, staleId, Role.INDIVIDUAL_USER, null);

        assertThat(result.getResponse().getStatus())
                .as("tài khoản đã tắt không gán vai trò lại được nên hạ cấp nó không làm mất người quản trị")
                .isEqualTo(200);
    }

    @Test
    void settingTheStatusItAlreadyHasIsRejected() throws Exception {
        Account systemAdmin = createAccount(Role.SYSTEM_ADMIN, null);
        Account member = register(Role.INDIVIDUAL_USER, null);

        MvcResult result = setStatus(systemAdmin, idOf(member), true);

        assertThat(result.getResponse().getStatus()).isEqualTo(400);
        assertThat(json(result).at("/message").asText()).contains("đang bật");
    }
}
