package com.budglee.finance;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.test.context.support.WithMockUser;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

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
        int responseStatus = mockMvc.perform(get("/api/v1/auth/__security_test__")
        ).andReturn().getResponse().getStatus();

        assertFalse(
                Set.of(401, 403).contains(responseStatus),
                "Public auth endpoint không được yêu cầu đăng nhập"
        );
    }

    @Test
    void protectedEndpointShouldRejectAnonymousRequest() throws Exception {
        int responseStatus = mockMvc.perform(
                get("/api/__security_test__")
        ).andReturn().getResponse().getStatus();

        assertEquals(401,
                responseStatus,
                "Request chưa đăng nhập phải nhận HTTP 401"
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


    @Test
    void invalidBearerTokenShouldBeRejected() throws Exception {
        mockMvc.perform(get("/api/__security_test__")
                        .header("Authorization", "Bearer invalid.jwt.token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminEndpointShouldRejectAnonymousRequest() throws Exception {
        mockMvc.perform(get("/api/v1/admin/__security_test__"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "user@test.com", roles = "USER")
    void normalUserShouldNotAccessAdminEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/admin/__security_test__"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "SYSTEM_ADMIN")
    void systemAdminShouldPassAuthorizationCheck() throws Exception {
        int responseStatus = mockMvc.perform(
                        get("/api/v1/admin/__security_test__"))
                .andReturn()
                .getResponse()
                .getStatus();

        assertNotEquals(
                401,
                responseStatus,
                "SYSTEM_ADMIN không được bị từ chối vì chưa đăng nhập"
        );

        assertNotEquals(
                403,
                responseStatus,
                "SYSTEM_ADMIN phải vượt qua kiểm tra phân quyền"
        );
    }
}