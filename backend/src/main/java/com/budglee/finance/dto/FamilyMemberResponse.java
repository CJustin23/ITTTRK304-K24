package com.budglee.finance.dto;

import com.budglee.finance.entity.Role;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class FamilyMemberResponse {

    private Long id;

    private String fullName;

    private String email;

    private String avatarUrl;

    private Role role;

    private LocalDateTime joinedAt;
}
