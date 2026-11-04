package com.budglee.finance.dto;

import com.budglee.finance.entity.FamilyInvitationStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class FamilyInvitationResponse {

    private Long id;

    private String familyGroupId;

    private String familyGroupName;

    private Long invitedById;

    private String invitedByName;

    private String inviteeEmail;

    private FamilyInvitationStatus status;

    private LocalDateTime createdAt;

    private LocalDateTime expiresAt;

    private LocalDateTime respondedAt;
}
