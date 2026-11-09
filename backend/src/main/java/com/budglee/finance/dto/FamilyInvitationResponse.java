package com.budglee.finance.dto;

import com.budglee.finance.entity.FamilyInvitationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FamilyInvitationResponse {

    private Long id;

    private String familyGroupId;

    private String familyGroupName;

    private Long invitedById;

    private String invitedByName;

    private String invitedByEmail;

    private String inviteeEmail;

    private String inviteeName;

    private FamilyInvitationStatus status;

    private LocalDateTime createdAt;

    private LocalDateTime expiresAt;

    private LocalDateTime respondedAt;
}
