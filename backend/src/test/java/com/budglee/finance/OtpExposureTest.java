package com.budglee.finance;

import com.budglee.finance.entity.Role;
import com.budglee.finance.entity.User;
import com.budglee.finance.repository.UserRepository;
import com.budglee.finance.security.PasswordResetService;
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
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * /auth/forgot-password là endpoint công khai. Nếu nó trả mã OTP trong response thì bất kỳ ai
 * biết email nạn nhân cũng gọi reset-password và chiếm tài khoản được — kể cả SYSTEM_ADMIN —
 * mà không cần đọc hộp thư. Mã chỉ được đi qua email; cấu hình mặc định phải giấu nó.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OtpExposureTest {

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

    private User newUser() {
        return userRepository.save(User.builder()
                .fullName("Người dùng quên mật khẩu")
                .email("otp." + UUID.randomUUID() + "@budglee.dev")
                .passwordHash(passwordEncoder.encode("MatKhau123"))
                .role(Role.INDIVIDUAL_USER)
                .enabled(true)
                .build());
    }

    private JsonNode json(MvcResult result) throws Exception {
        return om.readTree(new String(result.getResponse().getContentAsByteArray(), StandardCharsets.UTF_8));
    }

    @Test
    void forgotPasswordDoesNotHandTheCodeToTheCaller() throws Exception {
        User user = newUser();

        MvcResult result = mvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of("email", user.getEmail()))))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode data = json(result).at("/data");
        assertThat(data.at("/otp").isNull() || data.at("/otp").isMissingNode())
                .as("mã OTP không được nằm trong response của một endpoint ai cũng gọi được")
                .isTrue();
        assertThat(data.at("/email").asText()).isEqualTo(user.getEmail());
        assertThat(data.at("/message").asText()).contains("hộp thư");
    }

    @Test
    void resetStillWorksWhenTheCodeArrivesThroughTheEmailChannel() throws Exception {
        User user = newUser();
        // Kênh email: chỉ chủ hộp thư đọc được mã, nên lấy thẳng từ service là mô phỏng đúng luồng đó.
        String otp = passwordResetService.generateAndSaveCode(user.getEmail());

        mvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of(
                                "email", user.getEmail(),
                                "otp", otp,
                                "newPassword", "MatKhauMoi123"))))
                .andExpect(status().isOk());

        mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of(
                                "email", user.getEmail(),
                                "password", "MatKhauMoi123"))))
                .andExpect(status().isOk());
    }

    @Test
    void aCallerWhoCannotReadTheMailboxCannotTakeOverTheAccount() throws Exception {
        User victim = newUser();
        mvc.perform(post("/api/v1/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("email", victim.getEmail()))))
                .andExpect(status().isOk());

        // Kẻ tấn công không có mã thì phải bị chặn, và mật khẩu cũ vẫn đăng nhập được.
        MvcResult takeover = mvc.perform(post("/api/v1/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                        "email", victim.getEmail(),
                        "otp", "000000",
                        "newPassword", "MatKhauCuaToi123"))))
                .andReturn();

        assertThat(takeover.getResponse().getStatus()).isIn(400, 429);
        mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of(
                                "email", victim.getEmail(),
                                "password", "MatKhau123"))))
                .andExpect(status().isOk());
    }
}