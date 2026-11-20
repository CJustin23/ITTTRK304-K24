package com.budglee.finance.dto;

import com.budglee.finance.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FamilyMemberResponse {

    private Long id;

    private String fullName;

    private String email;

    private String avatarUrl;

    private Role role;

    private LocalDateTime joinedAt;

    private Boolean isOwner;
}
