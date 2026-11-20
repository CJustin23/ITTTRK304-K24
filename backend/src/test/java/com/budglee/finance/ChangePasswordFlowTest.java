package com.budglee.finance;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ChangePasswordFlowTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper om;

    private static String textOf(MvcResult result) {
        return new String(result.getResponse().getContentAsByteArray(), StandardCharsets.UTF_8);
    }

    private String newEmail() {
        return "changepw." + UUID.randomUUID() + "@gmail.com";
    }

    private String registerAndGetToken(String email, String password) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("fullName", "Thành viên Test");
        body.put("email", email);
        body.put("password", password);
        mvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(body)))
                .andExpect(status().isOk());

        Map<String, Object> loginBody = new HashMap<>();
        loginBody.put("email", email);
        loginBody.put("password", password);
        MvcResult loginResult = mvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(loginBody)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = om.readTree(textOf(loginResult));
        return json.get("data").get("token").asText();
    }

    @Test
    @DisplayName("Đổi mật khẩu thành công: sau khi đổi đăng nhập được bằng mật khẩu mới và từ chối mật khẩu cũ")
    void changePassword_Success_AllowsLoginWithNewPassword() throws Exception {
        String email = newEmail();
        String oldPassword = "MatKhauCu@123";
        String newPassword = "MatKhauMoi@456";

        String token = registerAndGetToken(email, oldPassword);

        // Gọi API đổi mật khẩu kèm token
        Map<String, Object> changePwBody = new HashMap<>();
        changePwBody.put("currentPassword", oldPassword);
        changePwBody.put("newPassword", newPassword);

        mvc.perform(post("/api/v1/auth/change-password")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(changePwBody)))
                .andExpect(status().isOk());

        // Đăng nhập lại bằng mật khẩu CŨ -> Phải bị từ chối 401
        Map<String, Object> oldLoginBody = new HashMap<>();
        oldLoginBody.put("email", email);
        oldLoginBody.put("password", oldPassword);
        mvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(oldLoginBody)))
                .andExpect(status().isUnauthorized());

        // Đăng nhập lại bằng mật khẩu MỚI -> Phải thành công 200 OK
        Map<String, Object> newLoginBody = new HashMap<>();
        newLoginBody.put("email", email);
        newLoginBody.put("password", newPassword);
        MvcResult newLoginResult = mvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(newLoginBody)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode loginData = om.readTree(textOf(newLoginResult)).get("data");
        assertThat(loginData.get("token").asText()).isNotBlank();
        assertThat(loginData.get("email").asText()).isEqualTo(email.toLowerCase());
    }

    @Test
    @DisplayName("Đổi mật khẩu thất bại khi nhập sai mật khẩu hiện tại -> 400 Bad Request")
    void changePassword_WrongCurrentPassword_Returns400() throws Exception {
        String email = newEmail();
        String oldPassword = "MatKhauCu@123";
        String token = registerAndGetToken(email, oldPassword);

        Map<String, Object> changePwBody = new HashMap<>();
        changePwBody.put("currentPassword", "SaiMatKhau@999");
        changePwBody.put("newPassword", "MatKhauMoi@456");

        mvc.perform(post("/api/v1/auth/change-password")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(changePwBody)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Đổi mật khẩu thất bại khi mật khẩu mới trùng mật khẩu cũ -> 400 Bad Request")
    void changePassword_SamePassword_Returns400() throws Exception {
        String email = newEmail();
        String oldPassword = "MatKhauCu@123";
        String token = registerAndGetToken(email, oldPassword);

        Map<String, Object> changePwBody = new HashMap<>();
        changePwBody.put("currentPassword", oldPassword);
        changePwBody.put("newPassword", oldPassword);

        mvc.perform(post("/api/v1/auth/change-password")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(changePwBody)))
                .andExpect(status().isBadRequest());
    }
}
