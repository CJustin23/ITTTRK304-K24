package com.budglee.finance;

import com.budglee.finance.entity.User;
import com.budglee.finance.repository.UserRepository;
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
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * DUAN-39 — phần đăng ký tài khoản.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthRegistrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper om;

    @Autowired
    private UserRepository userRepository;

    private String newEmail() {
        return "register." + UUID.randomUUID() + "@budglee.dev";
    }

    private Map<String, Object> payload(String fullName, String email, String password) {
        Map<String, Object> body = new HashMap<>();
        body.put("fullName", fullName);
        body.put("email", email);
        body.put("password", password);
        return body;
    }

    private static String textOf(MvcResult result) {
        return new String(result.getResponse().getContentAsByteArray(), StandardCharsets.UTF_8);
    }

    private MvcResult register(Map<String, Object> payload) throws Exception {
        return mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(payload)))
                .andReturn();
    }

    private JsonNode data(MvcResult result) throws Exception {
        return om.readTree(textOf(result)).at("/data");
    }

    @Test
    void registrationCreatesAccountWithoutIssuingTokenYet() throws Exception {
        String email = newEmail();
        MvcResult result = register(payload("Nguyễn Trường An", email, "MatKhau123"));

        assertThat(result.getResponse().getStatus()).isEqualTo(200);
        JsonNode body = om.readTree(textOf(result));
        assertThat(body.at("/success").asBoolean()).isTrue();
        assertThat(body.at("/data/id").asLong()).isPositive();
        assertThat(body.at("/data/email").asText()).isEqualTo(email);
        assertThat(body.at("/data/role").asText()).isEqualTo("INDIVIDUAL_USER");
        assertThat(body.at("/data/token").isNull()).as("chưa đăng nhập thì không có token").isTrue();
        assertThat(textOf(result)).doesNotContain("MatKhau123").doesNotContain("passwordHash");
    }

    @Test
    void upperCaseEmailIsTreatedAsDuplicateOfTheLowerCaseOne() throws Exception {
        String email = newEmail();
        assertThat(register(payload("Người thứ nhất", email, "MatKhau123")).getResponse().getStatus()).isEqualTo(200);

        MvcResult second = register(payload("Người thứ hai", email.toUpperCase(), "MatKhau456"));

        assertThat(second.getResponse().getStatus()).isEqualTo(409);
        assertThat(om.readTree(textOf(second)).at("/message").asText()).isEqualTo("Email đã được đăng ký");
        assertThat(userRepository.findByEmail(email.toUpperCase())).isEmpty();
    }

    @Test
    void cannotSelfAssignPrivilegedRole() throws Exception {
        String email = newEmail();
        Map<String, Object> body = payload("Kẻ leo quyền", email, "MatKhau123");
        body.put("role", "SYSTEM_ADMIN");

        assertThat(register(body).getResponse().getStatus()).isEqualTo(400);
        assertThat(userRepository.findByEmail(email)).isEmpty();

        String otherEmail = newEmail();
        Map<String, Object> familyAdmin = payload("Chủ hộ giả mạo", otherEmail, "MatKhau123");
        familyAdmin.put("role", "FAMILY_ADMIN");
        familyAdmin.put("familyGroupId", "HN-001");

        assertThat(register(familyAdmin).getResponse().getStatus()).isEqualTo(400);
        assertThat(userRepository.findByEmail(otherEmail)).isEmpty();
    }

    @Test
    void familyMemberNeedsAFamilyGroupAndStoresIt() throws Exception {
        String email = newEmail();
        Map<String, Object> missingGroup = payload("Thành viên", email, "MatKhau123");
        missingGroup.put("role", "FAMILY_MEMBER");
        assertThat(register(missingGroup).getResponse().getStatus()).isEqualTo(400);

        Map<String, Object> withGroup = payload("Thành viên", email, "MatKhau123");
        withGroup.put("role", "FAMILY_MEMBER");
        withGroup.put("familyGroupId", "  HN-042  ");
        MvcResult ok = register(withGroup);

        assertThat(ok.getResponse().getStatus()).isEqualTo(200);
        assertThat(data(ok).at("/role").asText()).isEqualTo("FAMILY_MEMBER");
        assertThat(data(ok).at("/familyGroupId").asText()).isEqualTo("HN-042");
    }

    @Test
    void individualUserCannotJoinAFamilyGroupAtRegistration() throws Exception {
        Map<String, Object> body = payload("Cá nhân", newEmail(), "MatKhau123");
        body.put("role", "INDIVIDUAL_USER");
        body.put("familyGroupId", "HN-999");

        assertThat(data(register(body)).at("/familyGroupId").isNull()).isTrue();
    }

    @Test
    void shortPasswordAndBlankFieldsFailValidation() throws Exception {
        assertThat(register(payload("Ai đó", newEmail(), "123")).getResponse().getStatus()).isEqualTo(400);
        assertThat(register(payload("", newEmail(), "MatKhau123")).getResponse().getStatus()).isEqualTo(400);
        assertThat(register(payload("Ai đó", "khong-phai-email", "MatKhau123")).getResponse().getStatus()).isEqualTo(400);
    }

    @Test
    void validationFailureIsReportedInApiEnvelope() throws Exception {
        MvcResult result = register(payload("Ai đó", newEmail(), "123"));

        JsonNode body = om.readTree(textOf(result));
        assertThat(body.at("/success").asBoolean()).isFalse();
        assertThat(body.at("/message").asText()).contains("Mật khẩu phải từ 6 ký tự");
    }

    @Test
    void passwordIsStoredAsBcryptHashNeverPlainText() throws Exception {
        String email = newEmail();
        register(payload("Nguyễn Trường An", email, "MatKhau123"));

        Optional<User> saved = userRepository.findByEmail(email);
        assertThat(saved).isPresent();
        String hash = saved.orElseThrow().getPasswordHash();
        assertThat(hash).startsWith("$2").hasSize(60).doesNotContain("MatKhau123");
    }

    // DUAN-40 sẽ thêm: request ẩn danh phải trả 401 (hiện scaffold trả 403),
    // và kiểm tra quyền theo vai trò khi đọc/ghi dữ liệu của hộ gia đình.
}
