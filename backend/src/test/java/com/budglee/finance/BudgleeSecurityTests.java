
package com.budglee.finance;

import com.budglee.finance.config.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BudgleeSecurityTests {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void publicAuthEndpointShouldNotRequireAuthentication() throws Exception {

        int responseStatus = mockMvc.perform(get("/api/v1/auth/__security_test__")).andReturn().getResponse().getStatus();

        assertFalse(
                Set.of(401, 403).contains(responseStatus),
                "Endpoint auth không nên bị từ chối bởi quy tắc xác thực URL"
        );
    }


    @Test
    void protectedEndpointShouldRejectAnonymousRequest() throws Exception {
        int responseStatus = mockMvc.perform(get("/api/__security_test__")
        ).andReturn().getResponse().getStatus();

        assertTrue(Set.of(401, 403).contains(responseStatus), "API được bảo vệ phải từ chối request chưa xác thực"
        );
    }


    @Test
    void passwordEncoderShouldHashAndVerifyPassword() {
        String rawPassword = "TestPassword@123";

        String encodedPassword = passwordEncoder.encode(rawPassword);

        assertNotEquals(rawPassword, encodedPassword);
        assertTrue(passwordEncoder.matches(rawPassword, encodedPassword));
        assertFalse(passwordEncoder.matches("WrongPassword@123", encodedPassword));
    }
}
