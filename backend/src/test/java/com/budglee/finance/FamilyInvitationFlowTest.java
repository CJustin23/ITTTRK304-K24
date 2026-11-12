package com.budglee.finance;

import com.budglee.finance.dto.FamilyInvitationRequest;
import com.budglee.finance.entity.FamilyGroup;
import com.budglee.finance.entity.Role;
import com.budglee.finance.entity.User;
import com.budglee.finance.repository.FamilyGroupRepository;
import com.budglee.finance.repository.FamilyInvitationRepository;
import com.budglee.finance.repository.UserRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class FamilyInvitationFlowTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper om;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FamilyGroupRepository familyGroupRepository;

    @Autowired
    private FamilyInvitationRepository familyInvitationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static String textOf(MvcResult result) {
        return new String(result.getResponse().getContentAsByteArray(), StandardCharsets.UTF_8);
    }

    private User createUser(String email, Role role, String familyGroupId) {
        return userRepository.save(User.builder()
                .fullName("User " + email.split("@")[0])
                .email(email)
                .passwordHash(passwordEncoder.encode("Budglee@2026"))
                .role(role)
                .familyGroupId(familyGroupId)
                .enabled(true)
                .build());
    }

    private String loginAndGetToken(String email, String password) throws Exception {
        MvcResult res = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of("email", email, "password", password))))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode root = om.readTree(textOf(res));
        return root.path("data").path("token").asText();
    }

    @Test
    @DisplayName("Luồng trọn vẹn: Chủ hộ mời tài khoản đã đăng ký -> Người nhận được thông báo -> Xác nhận tham gia gia đình thành công")
    void fullFamilyInvitationLifecycle() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String adminEmail = "admin." + suffix + "@gmail.com";
        String memberEmail = "member." + suffix + "@gmail.com";

        // 1. Tạo Chủ hộ và Nhóm gia đình
        String groupId = "FAM-TEST-" + suffix;
        User admin = createUser(adminEmail, Role.FAMILY_ADMIN, groupId);
        familyGroupRepository.save(FamilyGroup.builder()
                .id(groupId)
                .name("Gia đình Test " + suffix)
                .createdBy(admin)
                .build());

        // 2. Tạo Tài khoản thành viên độc lập (chưa có gia đình)
        User member = createUser(memberEmail, Role.INDIVIDUAL_USER, null);

        String adminToken = loginAndGetToken(adminEmail, "Budglee@2026");
        String memberToken = loginAndGetToken(memberEmail, "Budglee@2026");

        // 3. Chủ hộ kiểm tra tài khoản trước khi mời
        MvcResult checkRes = mvc.perform(get("/api/v1/family/check-user")
                        .param("email", memberEmail)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode checkNode = om.readTree(textOf(checkRes));
        assertThat(checkNode.path("data").path("exists").asBoolean()).isTrue();

        // 4. Chủ hộ gửi lời mời
        MvcResult inviteRes = mvc.perform(post("/api/v1/family/invitations")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(new FamilyInvitationRequest(memberEmail))))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode inviteNode = om.readTree(textOf(inviteRes));
        long invitationId = inviteNode.path("data").path("id").asLong();
        assertThat(inviteNode.path("data").path("status").asText()).isEqualTo("PENDING");
        assertThat(inviteNode.path("data").path("familyGroupName").asText()).isEqualTo("Gia đình Test " + suffix);

        // 5. Người được mời kiểm tra danh sách lời mời đã nhận
        MvcResult receivedRes = mvc.perform(get("/api/v1/family/invitations/received")
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode receivedNode = om.readTree(textOf(receivedRes));
        assertThat(receivedNode.path("data").isArray()).isTrue();
        assertThat(receivedNode.path("data").size()).isGreaterThanOrEqualTo(1);

        // 6. Người được mời ấn XÁC NHẬN tham gia
        MvcResult acceptRes = mvc.perform(post("/api/v1/family/invitations/" + invitationId + "/accept")
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode acceptNode = om.readTree(textOf(acceptRes));
        assertThat(acceptNode.path("data").path("status").asText()).isEqualTo("ACCEPTED");

        // 7. Kiểm tra trạng thái người dùng trong database
        User updatedMember = userRepository.findById(member.getId()).orElseThrow();
        assertThat(updatedMember.getRole()).isEqualTo(Role.FAMILY_MEMBER);
        assertThat(updatedMember.getFamilyGroupId()).isEqualTo(groupId);
    }
}

