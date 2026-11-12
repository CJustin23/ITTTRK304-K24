package com.budglee.finance;

import com.budglee.finance.entity.Role;
import com.budglee.finance.entity.User;
import com.budglee.finance.repository.UserRepository;
import com.budglee.finance.security.PasswordResetService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
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
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PasswordResetFlowTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper om;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private PasswordResetService passwordResetService;

    private User createTestUser(String rawPassword) {
        String email = "test.reset." + UUID.randomUUID() + "@gmail.com";
        User user = User.builder()
                .fullName("Test Reset User")
                .email(email)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .role(Role.INDIVIDUAL_USER)
                .enabled(true)
                .build();
        return userRepository.save(user);
    }

    private static String textOf(MvcResult result) {
        return new String(result.getResponse().getContentAsByteArray(), StandardCharsets.UTF_8);
    }

    @Test
    @DisplayName("Quên mật khẩu: Email không tồn tại thì trả về 404 NOT_FOUND")
    void forgotPassword_nonExistentEmail_returns404() throws Exception {
        Map<String, String> body = Map.of("email", "nonexistent." + UUID.randomUUID() + "@gmail.com");

        MvcResult result = mvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(body)))
                .andExpect(status().isNotFound())
                .andReturn();

        JsonNode json = om.readTree(textOf(result));
        assertThat(json.get("success").asBoolean()).isFalse();
        assertThat(json.get("message").asText()).contains("Không tìm thấy tài khoản");
    }

    @Test
    @DisplayName("Quên mật khẩu: Email hợp lệ sinh mã đúng 6 chữ số (0-9)")
    void forgotPassword_validEmail_generates6DigitNumericOtp() throws Exception {
        User user = createTestUser("OldPass@123");
        Map<String, String> body = Map.of("email", user.getEmail());

        MvcResult result = mvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = om.readTree(textOf(result));
        assertThat(json.get("success").asBoolean()).isTrue();
        assertThat(json.get("message").asText()).contains("Mã xác thực 6 chữ số đã được gửi");

        // Kiểm tra phương thức sinh mã của PasswordResetService
        String directOtp = passwordResetService.generateNumericOtp();
        assertThat(directOtp).hasSize(6);
        assertThat(directOtp).matches("^\\d{6}$");
    }

    @Test
    @DisplayName("Đổi mật khẩu: Nhập sai mã OTP thì trả về 400 BAD_REQUEST")
    void resetPassword_wrongOtp_returns400() throws Exception {
        User user = createTestUser("OldPass@123");
        passwordResetService.generateAndSaveCode(user.getEmail());

        Map<String, String> body = Map.of(
                "email", user.getEmail(),
                "otp", "000000",
                "newPassword", "NewPass@456"
        );

        MvcResult result = mvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andReturn();

        JsonNode json = om.readTree(textOf(result));
        assertThat(json.get("success").asBoolean()).isFalse();
        assertThat(json.get("message").asText()).contains("không chính xác");
    }

    @Test
    @DisplayName("Đổi mật khẩu: Nhập đúng mã OTP thì cập nhật mật khẩu mới và đăng nhập được ngay")
    void resetPassword_correctOtp_updatesPasswordAndAllowsLogin() throws Exception {
        User user = createTestUser("OldPass@123");
        String otp = passwordResetService.generateAndSaveCode(user.getEmail());

        Map<String, String> resetBody = Map.of(
                "email", user.getEmail(),
                "otp", otp,
                "newPassword", "NewPass@999"
        );

        mvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(resetBody)))
                .andExpect(status().isOk());

        // Đăng nhập bằng mật khẩu mới phải thành công 200 OK
        Map<String, String> loginNew = Map.of(
                "email", user.getEmail(),
                "password", "NewPass@999"
        );
        mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(loginNew)))
                .andExpect(status().isOk());

        // Đăng nhập bằng mật khẩu cũ phải bị từ chối 401 UNAUTHORIZED
        Map<String, String> loginOld = Map.of(
                "email", user.getEmail(),
                "password", "OldPass@123"
        );
        mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(loginOld)))
                .andExpect(status().isUnauthorized());

        // Mã OTP đã dùng thì không được tái sử dụng
        mvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(resetBody)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Đổi mật khẩu: Nhập sai mã quá 5 lần thì khoá mã OTP (429 TOO_MANY_REQUESTS)")
    void resetPassword_tooManyWrongAttempts_locksOtp() throws Exception {
        User user = createTestUser("OldPass@123");
        passwordResetService.generateAndSaveCode(user.getEmail());

        Map<String, String> wrongBody = Map.of(
                "email", user.getEmail(),
                "otp", "111111",
                "newPassword", "NewPass@123"
        );

        // 4 lần đầu sai: trả 400 kèm số lần còn lại
        for (int i = 0; i < 4; i++) {
            mvc.perform(post("/api/v1/auth/reset-password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(om.writeValueAsString(wrongBody)))
                    .andExpect(status().isBadRequest());
        }

        // Lần thứ 5 sai: trả 429 và huỷ mã
        mvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(wrongBody)))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    @DisplayName("Xác thực OTP: Nhập đúng mã OTP thì trả về 200 OK (Bước 2)")
    void verifyOtp_correctOtp_returns200() throws Exception {
        User user = createTestUser("OldPass@123");
        String otp = passwordResetService.generateAndSaveCode(user.getEmail());

        Map<String, String> body = Map.of(
                "email", user.getEmail(),
                "otp", otp
        );

        mvc.perform(post("/api/v1/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(body)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Xác thực OTP: Nhập sai mã OTP thì trả về 400 BAD_REQUEST")
    void verifyOtp_wrongOtp_returns400() throws Exception {
        User user = createTestUser("OldPass@123");
        passwordResetService.generateAndSaveCode(user.getEmail());

        Map<String, String> body = Map.of(
                "email", user.getEmail(),
                "otp", "999999"
        );

        mvc.perform(post("/api/v1/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(body)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Đổi mật khẩu: Mật khẩu mới yếu hoặc dưới 8 ký tự thì trả về 400 BAD_REQUEST")
    void resetPassword_weakPassword_returns400() throws Exception {
        User user = createTestUser("OldPass@123");
        String otp = passwordResetService.generateAndSaveCode(user.getEmail());

        // Mật khẩu chỉ có 6 ký tự (dưới 8 ký tự)
        Map<String, String> shortPassBody = Map.of(
                "email", user.getEmail(),
                "otp", otp,
                "newPassword", "Pass1"
        );
        mvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(shortPassBody)))
                .andExpect(status().isBadRequest());

        // Mật khẩu không có chữ HOA và số
        Map<String, String> noUpperBody = Map.of(
                "email", user.getEmail(),
                "otp", otp,
                "newPassword", "passwordonly"
        );
        mvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(noUpperBody)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Đổi mật khẩu: Email lạ không tồn tại trong DB thì trả về 404 NOT_FOUND")
    void resetPassword_nonExistentEmail_returns404() throws Exception {
        String randomEmail = "stranger." + UUID.randomUUID() + "@example.com";
        Map<String, String> body = Map.of(
                "email", randomEmail,
                "otp", "123456",
                "newPassword", "StrongPass@2026"
        );
        mvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(body)))
                .andExpect(status().isNotFound());
    }
}

