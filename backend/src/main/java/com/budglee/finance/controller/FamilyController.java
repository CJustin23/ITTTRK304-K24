package com.budglee.finance.controller;

import com.budglee.finance.dto.ApiResponse;
import com.budglee.finance.dto.FamilyInvitationRequest;
import com.budglee.finance.dto.FamilyInvitationResponse;
import com.budglee.finance.dto.FamilyMemberResponse;
import com.budglee.finance.security.UserPrincipal;
import com.budglee.finance.service.FamilyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/family")
@RequiredArgsConstructor
@Tag(name = "Family", description = "Quản lý nhóm gia đình và lời mời")
public class FamilyController {

    private final FamilyService familyService;

    @PostMapping("/invitations")
    @Operation(summary = "Chủ nhóm gửi lời mời tham gia gia đình")
    public ResponseEntity<ApiResponse<FamilyInvitationResponse>> sendInvitation(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody FamilyInvitationRequest request
    ) {
        FamilyInvitationResponse response =
                familyService.sendInvitation(currentUser.getId(), request);

        return ResponseEntity.ok(
                ApiResponse.ok(response, "Gửi lời mời thành công")
        );
    }

    @GetMapping("/invitations/sent")
    @Operation(summary = "Lấy danh sách lời mời đã gửi")
    public ResponseEntity<ApiResponse<List<FamilyInvitationResponse>>> getSentInvitations(
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        List<FamilyInvitationResponse> invitations =
                familyService.getSentInvitations(currentUser.getId());

        return ResponseEntity.ok(
                ApiResponse.ok(invitations, "Lấy danh sách lời mời đã gửi thành công")
        );
    }

    @DeleteMapping("/invitations/{invitationId}")
    @Operation(summary = "Hủy lời mời tham gia gia đình")
    public ResponseEntity<ApiResponse<Void>> cancelInvitation(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long invitationId
    ) {
        familyService.cancelInvitation(currentUser.getId(), invitationId);

        return ResponseEntity.ok(
                ApiResponse.ok(null, "Hủy lời mời thành công")
        );
    }

    @GetMapping("/invitations/received")
    @Operation(summary = "Lấy danh sách lời mời đã nhận")
    public ResponseEntity<ApiResponse<List<FamilyInvitationResponse>>> getReceivedInvitations(
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        List<FamilyInvitationResponse> invitations =
                familyService.getReceivedInvitations(currentUser.getId());

        return ResponseEntity.ok(
                ApiResponse.ok(invitations, "Lấy danh sách lời mời đã nhận thành công")
        );
    }

    @PostMapping("/invitations/{invitationId}/accept")
    @Operation(summary = "Chấp nhận lời mời tham gia gia đình")
    public ResponseEntity<ApiResponse<FamilyInvitationResponse>> acceptInvitation(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long invitationId
    ) {
        FamilyInvitationResponse response =
                familyService.acceptInvitation(currentUser.getId(), invitationId);

        return ResponseEntity.ok(
                ApiResponse.ok(response, "Chấp nhận lời mời thành công")
        );
    }

    @PostMapping("/invitations/{invitationId}/reject")
    @Operation(summary = "Từ chối lời mời tham gia gia đình")
    public ResponseEntity<ApiResponse<FamilyInvitationResponse>> rejectInvitation(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long invitationId
    ) {
        FamilyInvitationResponse response =
                familyService.rejectInvitation(currentUser.getId(), invitationId);

        return ResponseEntity.ok(
                ApiResponse.ok(response, "Từ chối lời mời thành công")
        );
    }

    @GetMapping("/members")
    @Operation(summary = "Lấy danh sách thành viên gia đình")
    public ResponseEntity<ApiResponse<List<FamilyMemberResponse>>> getFamilyMembers(
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        List<FamilyMemberResponse> members =
                familyService.getFamilyMembers(currentUser.getId());

        return ResponseEntity.ok(
                ApiResponse.ok(members, "Lấy danh sách thành viên thành công")
        );
    }

    @DeleteMapping("/members/{memberId}")
    @Operation(summary = "Chủ nhóm xóa thành viên khỏi gia đình")
    public ResponseEntity<ApiResponse<Void>> removeFamilyMember(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long memberId
    ) {
        familyService.removeFamilyMember(currentUser.getId(), memberId);

        return ResponseEntity.ok(
                ApiResponse.ok(null, "Xóa thành viên khỏi gia đình thành công")
        );
    }
}
