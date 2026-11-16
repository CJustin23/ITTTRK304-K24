package com.budglee.finance;

import com.budglee.finance.entity.Role;
import com.budglee.finance.entity.User;
import com.budglee.finance.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Chế độ demo cục bộ (dev/local bật app.security.expose-otp): giao diện đọc mã trong response
 * để điền sẵn cho người chấm. Test này giữ cho cờ đó không bị sửa mất, còn OtpExposureTest giữ
 * cho mặc định của production không bị mở ngược lại.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = "app.security.expose-otp=true")
class OtpDemoModeTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper om;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void demoModeReturnsTheSixDigitCodeForTheUiToPrefill() throws Exception {
        User user = userRepository.save(User.builder()
                .fullName("Người dùng demo")
                .email("otp.demo." + UUID.randomUUID() + "@gmail.com")
                .passwordHash(passwordEncoder.encode("MatKhau123"))
                .role(Role.INDIVIDUAL_USER)
                .enabled(true)
                .build());

        var result = mvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of("email", user.getEmail()))))
                .andExpect(status().isOk())
                .andReturn();

        String otp = om.readTree(new String(result.getResponse().getContentAsByteArray(), StandardCharsets.UTF_8))
                .at("/data/otp").asText();
        assertThat(otp).matches("^\\d{6}$");
    }
}