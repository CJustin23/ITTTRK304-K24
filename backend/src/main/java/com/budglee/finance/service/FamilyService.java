package com.budglee.finance.service;

import com.budglee.finance.dto.FamilyInvitationRequest;
import com.budglee.finance.dto.FamilyInvitationResponse;
import com.budglee.finance.dto.FamilyMemberResponse;
import com.budglee.finance.dto.FamilyUserLookupResponse;
import com.budglee.finance.entity.*;
import com.budglee.finance.repository.FamilyGroupRepository;
import com.budglee.finance.repository.FamilyInvitationRepository;
import com.budglee.finance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class FamilyService {

    private final UserRepository userRepository;
    private final FamilyGroupRepository familyGroupRepository;
    private final FamilyInvitationRepository familyInvitationRepository;

    /**
     * Lấy thông tin người dùng hiện tại.
     */
    private User getCurrentUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy tài khoản"
                ));
    }

    /**
     * Xác minh người dùng hiện tại là chủ sở hữu thực sự của nhóm.
     */
    private FamilyGroup getOwnedFamilyGroup(Long userId) {
        User user = getCurrentUser(userId);

        if (user.getRole() != Role.FAMILY_ADMIN) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Bạn không có quyền quản lý nhóm gia đình"
            );
        }

        if (user.getFamilyGroupId() != null && !user.getFamilyGroupId().isBlank()) {
            var groupOpt = familyGroupRepository.findById(user.getFamilyGroupId());
            if (groupOpt.isPresent()) {
                return groupOpt.get();
            }
        }

        // Tự tạo nhóm gia đình nếu chưa có cho FAMILY_ADMIN
        String newGroupId = "FAM-" + user.getId() + "-" + (System.currentTimeMillis() % 10000);
        String groupName = "Gia đình của " + user.getFullName();
        FamilyGroup newGroup = familyGroupRepository.save(FamilyGroup.builder()
                .id(newGroupId)
                .name(groupName)
                .createdBy(user)
                .build());

        user.setFamilyGroupId(newGroupId);
        userRepository.save(user);
        return newGroup;
    }

    /**
     * Chuyển lời mời thành DTO trả về frontend.
     */
    private FamilyInvitationResponse toInvitationResponse(
            FamilyInvitation invitation
    ) {
        FamilyGroup familyGroup = familyGroupRepository
                .findById(invitation.getFamilyGroupId())
                .orElse(null);

        String groupName = (familyGroup != null && familyGroup.getName() != null)
                ? familyGroup.getName()
                : "Sổ quỹ gia đình";

        return FamilyInvitationResponse.builder()
                .id(invitation.getId())
                .familyGroupId(invitation.getFamilyGroupId())
                .familyGroupName(groupName)
                .invitedById(invitation.getInvitedBy().getId())
                .invitedByName(invitation.getInvitedBy().getFullName())
                .invitedByEmail(invitation.getInvitedBy().getEmail())
                .inviteeEmail(invitation.getInvitee().getEmail())
                .inviteeName(invitation.getInvitee().getFullName())
                .status(invitation.getStatus())
                .createdAt(invitation.getCreatedAt())
                .expiresAt(invitation.getExpiresAt())
                .respondedAt(invitation.getRespondedAt())
                .build();
    }

    /**
     * Chuyển người dùng thành DTO thành viên gia đình.
     */
    private FamilyMemberResponse toMemberResponse(User user) {
        return toMemberResponse(user, null);
    }

    private FamilyMemberResponse toMemberResponse(User user, Long ownerId) {
        boolean isOwner = (ownerId != null && ownerId.equals(user.getId()));
        return FamilyMemberResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .joinedAt(user.getCreatedAt())
                .isOwner(isOwner)
                .build();
    }

    /**
     * Chủ nhóm gửi lời mời tham gia gia đình bằng email.
     */
    public FamilyInvitationResponse sendInvitation(
            Long currentUserId,
            FamilyInvitationRequest request
    ) {
        FamilyGroup familyGroup = getOwnedFamilyGroup(currentUserId);

        String email = request.getEmail().trim().toLowerCase();

        User currentUser = getCurrentUser(currentUserId);

        if (currentUser.getEmail().equalsIgnoreCase(email)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Bạn không thể tự gửi lời mời cho chính mình"
            );
        }

        User invitee = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Email này chưa đăng ký tài khoản Budglee"
                ));

        if (invitee.getFamilyGroupId() != null
                && !invitee.getFamilyGroupId().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Tài khoản này đã thuộc một gia đình"
            );
        }

        boolean invitationExists =
                familyInvitationRepository
                        .existsByFamilyGroupIdAndInviteeIdAndStatus(
                                familyGroup.getId(),
                                invitee.getId(),
                                FamilyInvitationStatus.PENDING
                        );

        if (invitationExists) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Đã có lời mời đang chờ xử lý cho tài khoản này"
            );
        }

        LocalDateTime now = LocalDateTime.now();

        FamilyInvitation invitation = FamilyInvitation.builder()
                .familyGroupId(familyGroup.getId())
                .invitedBy(currentUser)
                .invitee(invitee)
                .status(FamilyInvitationStatus.PENDING)
                .expiresAt(now.plusDays(7))
                .build();

        FamilyInvitation savedInvitation =
                familyInvitationRepository.save(invitation);

        return toInvitationResponse(savedInvitation);
    }

    /**
     * Lấy danh sách lời mời của nhóm gia đình hiện tại.
     */
    public List<FamilyInvitationResponse> getSentInvitations(
            Long currentUserId
    ) {
        FamilyGroup familyGroup = getOwnedFamilyGroup(currentUserId);

        List<FamilyInvitation> invitations =
                familyInvitationRepository
                        .findByFamilyGroupIdOrderByCreatedAtDesc(
                                familyGroup.getId()
                        );

        LocalDateTime now = LocalDateTime.now();

        for (FamilyInvitation invitation : invitations) {
            if (invitation.getStatus() == FamilyInvitationStatus.PENDING
                    && !invitation.getExpiresAt().isAfter(now)) {

                invitation.setStatus(FamilyInvitationStatus.EXPIRED);
                invitation.setRespondedAt(now);

                familyInvitationRepository.save(invitation);
            }
        }

        return invitations.stream()
                .map(this::toInvitationResponse)
                .toList();
    }

    /**
     * Chủ nhóm hủy lời mời đang chờ xử lý.
     */
    @Transactional(noRollbackFor = ResponseStatusException.class)
    public void cancelInvitation(Long currentUserId, Long invitationId) {
        FamilyGroup familyGroup = getOwnedFamilyGroup(currentUserId);

        FamilyInvitation invitation = familyInvitationRepository
                .findByIdAndInvitedById(invitationId, currentUserId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy lời mời"
                ));

        if (!invitation.getFamilyGroupId().equals(familyGroup.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Bạn không có quyền hủy lời mời này"
            );
        }

        if (invitation.getStatus() != FamilyInvitationStatus.PENDING) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Chỉ có thể hủy lời mời đang chờ xử lý"
            );
        }

        LocalDateTime now = LocalDateTime.now();

        if (!invitation.getExpiresAt().isAfter(now)) {
            invitation.setStatus(FamilyInvitationStatus.EXPIRED);
            invitation.setRespondedAt(now);
            familyInvitationRepository.save(invitation);

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Lời mời đã hết hạn"
            );
        }

        invitation.setStatus(FamilyInvitationStatus.CANCELLED);
        invitation.setRespondedAt(now);

        familyInvitationRepository.save(invitation);
    }

    /**
     * Lấy danh sách lời mời mà tài khoản hiện tại nhận được.
     */
    public List<FamilyInvitationResponse> getReceivedInvitations(
            Long currentUserId
    ) {
        List<FamilyInvitation> invitations =
                familyInvitationRepository
                        .findByInviteeIdOrderByCreatedAtDesc(currentUserId);

        LocalDateTime now = LocalDateTime.now();

        for (FamilyInvitation invitation : invitations) {
            if (invitation.getStatus() == FamilyInvitationStatus.PENDING
                    && !invitation.getExpiresAt().isAfter(now)) {

                invitation.setStatus(FamilyInvitationStatus.EXPIRED);
                invitation.setRespondedAt(now);

                familyInvitationRepository.save(invitation);
            }
        }

        return invitations.stream()
                .map(this::toInvitationResponse)
                .toList();
    }

    /**
     * Người được mời chấp nhận lời mời tham gia gia đình.
     */
    @Transactional(noRollbackFor = ResponseStatusException.class)
    public FamilyInvitationResponse acceptInvitation(
            Long currentUserId,
            Long invitationId
    ) {
        User invitee = getCurrentUser(currentUserId);

        FamilyInvitation invitation = familyInvitationRepository
                .findByIdAndInviteeId(invitationId, currentUserId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy lời mời dành cho tài khoản của bạn"
                ));

        if (invitation.getStatus() != FamilyInvitationStatus.PENDING) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Lời mời này không còn ở trạng thái chờ xử lý"
            );
        }

        LocalDateTime now = LocalDateTime.now();

        if (!invitation.getExpiresAt().isAfter(now)) {
            invitation.setStatus(FamilyInvitationStatus.EXPIRED);
            invitation.setRespondedAt(now);
            familyInvitationRepository.save(invitation);

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Lời mời đã hết hạn"
            );
        }

        if (invitee.getFamilyGroupId() != null
                && !invitee.getFamilyGroupId().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Bạn đã thuộc một gia đình khác"
            );
        }

        FamilyGroup familyGroup = familyGroupRepository
                .findById(invitation.getFamilyGroupId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Nhóm gia đình không còn tồn tại"
                ));

        invitation.setStatus(FamilyInvitationStatus.ACCEPTED);
        invitation.setRespondedAt(now);

        invitee.setFamilyGroupId(familyGroup.getId());
        invitee.setRole(Role.FAMILY_MEMBER);

        userRepository.save(invitee);
        familyInvitationRepository.save(invitation);

        return toInvitationResponse(invitation);
    }

    /**
     * Người được mời từ chối lời mời tham gia gia đình.
     */
    @Transactional(noRollbackFor = ResponseStatusException.class)
    public FamilyInvitationResponse rejectInvitation(
            Long currentUserId,
            Long invitationId
    ) {
        FamilyInvitation invitation = familyInvitationRepository
                .findByIdAndInviteeId(invitationId, currentUserId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy lời mời dành cho tài khoản của bạn"
                ));

        if (invitation.getStatus() != FamilyInvitationStatus.PENDING) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Lời mời này không còn ở trạng thái chờ xử lý"
            );
        }

        LocalDateTime now = LocalDateTime.now();

        if (!invitation.getExpiresAt().isAfter(now)) {
            invitation.setStatus(FamilyInvitationStatus.EXPIRED);
            invitation.setRespondedAt(now);
            familyInvitationRepository.save(invitation);

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Lời mời đã hết hạn"
            );
        }

        invitation.setStatus(FamilyInvitationStatus.REJECTED);
        invitation.setRespondedAt(now);

        FamilyInvitation savedInvitation =
                familyInvitationRepository.save(invitation);

        return toInvitationResponse(savedInvitation);
    }

    /**
     * Lấy danh sách thành viên thuộc nhóm gia đình hiện tại.
     */
    @Transactional(readOnly = true)
    public List<FamilyMemberResponse> getFamilyMembers(Long currentUserId) {
        User user = getCurrentUser(currentUserId);
        String groupId = user.getFamilyGroupId();

        if (groupId == null || groupId.isBlank()) {
            if (user.getRole() == Role.FAMILY_ADMIN) {
                groupId = getOwnedFamilyGroup(currentUserId).getId();
            } else {
                return List.of();
            }
        }

        FamilyGroup familyGroup = familyGroupRepository.findById(groupId).orElse(null);
        Long ownerId = (familyGroup != null && familyGroup.getCreatedBy() != null)
                ? familyGroup.getCreatedBy().getId()
                : null;

        return userRepository.findByFamilyGroupId(groupId).stream()
                .map(u -> toMemberResponse(u, ownerId))
                .toList();
    }

    /**
     * Chủ nhóm xóa một thành viên khỏi gia đình.
     */
    @Transactional
    public void removeFamilyMember(Long currentUserId, Long memberId) {
        removeFamilyMember(currentUserId, memberId, null);
    }

    @Transactional
    public void removeFamilyMember(
            Long currentUserId,
            Long memberId,
            String email
    ) {
        FamilyGroup familyGroup = getOwnedFamilyGroup(currentUserId);

        User member = null;
        if (memberId != null) {
            member = userRepository.findById(memberId).orElse(null);
        }
        if (member == null && email != null && !email.isBlank()) {
            member = userRepository.findByEmail(email.trim().toLowerCase()).orElse(null);
        }

        if (member == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Không tìm thấy thành viên"
            );
        }

        if (currentUserId.equals(member.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Chủ nhóm không thể tự xóa mình khỏi gia đình"
            );
        }

        if (familyGroup.getCreatedBy() != null
                && member.getId().equals(familyGroup.getCreatedBy().getId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Không thể xóa chủ hộ sáng lập sổ quỹ"
            );
        }

        if (member.getFamilyGroupId() == null || !familyGroup.getId().equals(member.getFamilyGroupId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tài khoản này không thuộc gia đình của bạn"
            );
        }

        member.setFamilyGroupId(null);
        member.setRole(Role.INDIVIDUAL_USER);

        userRepository.save(member);
    }

    /**
     * Cập nhật vai trò thành viên gia đình (FAMILY_ADMIN hoặc FAMILY_MEMBER).
     */
    @Transactional
    public FamilyMemberResponse updateMemberRole(Long currentUserId, Long memberId, Role newRole) {
        FamilyGroup familyGroup = getOwnedFamilyGroup(currentUserId);

        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy thành viên"
                ));

        if (!familyGroup.getId().equals(member.getFamilyGroupId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tài khoản này không thuộc gia đình của bạn"
            );
        }

        if (familyGroup.getCreatedBy() != null
                && member.getId().equals(familyGroup.getCreatedBy().getId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Không thể thay đổi vai trò của Chủ hộ sáng lập sổ quỹ"
            );
        }

        if (newRole != Role.FAMILY_ADMIN && newRole != Role.FAMILY_MEMBER) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Vai trò chỉ có thể là FAMILY_ADMIN hoặc FAMILY_MEMBER"
            );
        }

        member.setRole(newRole);
        User saved = userRepository.save(member);

        Long ownerId = (familyGroup.getCreatedBy() != null)
                ? familyGroup.getCreatedBy().getId()
                : null;
        return toMemberResponse(saved, ownerId);
    }

    /**
     * Kiểm tra tính hợp lệ của tài khoản trước khi thêm vào nhóm gia đình.
     */
    @Transactional(readOnly = true)
    public FamilyUserLookupResponse checkUserForFamily(Long currentUserId, String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email không được để trống");
        }

        String targetEmail = email.trim().toLowerCase(java.util.Locale.ROOT);
        FamilyGroup familyGroup = null;

        if (currentUserId != null) {
            try {
                User currentUser = getCurrentUser(currentUserId);
                if (currentUser.getEmail().equalsIgnoreCase(targetEmail)) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Bạn không thể tự thêm chính mình vào nhóm gia đình"
                    );
                }
                if (currentUser.getFamilyGroupId() != null && !currentUser.getFamilyGroupId().isBlank()) {
                    familyGroup = familyGroupRepository.findById(currentUser.getFamilyGroupId()).orElse(null);
                }
            } catch (ResponseStatusException e) {
                if (e.getStatusCode() == HttpStatus.BAD_REQUEST) throw e;
            }
        }

        User targetUser = userRepository.findByEmail(targetEmail)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Tài khoản với email này chưa tồn tại trong hệ thống. Vui lòng kiểm tra lại email hoặc yêu cầu thành viên đăng ký trước!"
                ));

        if (targetUser.getFamilyGroupId() != null && !targetUser.getFamilyGroupId().isBlank()) {
            if (familyGroup != null && targetUser.getFamilyGroupId().equals(familyGroup.getId())) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Tài khoản này đã là thành viên trong nhóm gia đình của bạn"
                );
            } else {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Tài khoản này đã thuộc một nhóm gia đình khác"
                );
            }
        }

        return FamilyUserLookupResponse.builder()
                .id(targetUser.getId())
                .fullName(targetUser.getFullName())
                .email(targetUser.getEmail())
                .avatarUrl(targetUser.getAvatarUrl())
                .role(targetUser.getRole())
                .exists(true)
                .message("Tài khoản hợp lệ")
                .build();
    }

    /**
     * Thêm trực tiếp một thành viên vào nhóm gia đình bằng email.
     */
    public FamilyMemberResponse addDirectMember(Long currentUserId, FamilyInvitationRequest request) {
        FamilyGroup familyGroup = getOwnedFamilyGroup(currentUserId);
        String targetEmail = request.getEmail().trim().toLowerCase(java.util.Locale.ROOT);
        User currentUser = getCurrentUser(currentUserId);

        if (currentUser.getEmail().equalsIgnoreCase(targetEmail)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Bạn không thể tự thêm chính mình vào nhóm gia đình"
            );
        }

        User targetUser = userRepository.findByEmail(targetEmail)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Tài khoản với email này chưa tồn tại trong hệ thống. Vui lòng kiểm tra lại email hoặc yêu cầu thành viên đăng ký trước!"
                ));

        if (targetUser.getFamilyGroupId() != null && !targetUser.getFamilyGroupId().isBlank()) {
            if (targetUser.getFamilyGroupId().equals(familyGroup.getId())) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Tài khoản này đã là thành viên trong nhóm gia đình của bạn"
                );
            } else {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Tài khoản này đã thuộc một nhóm gia đình khác"
                );
            }
        }

        targetUser.setFamilyGroupId(familyGroup.getId());
        targetUser.setRole(Role.FAMILY_MEMBER);
        User savedUser = userRepository.save(targetUser);

        Long ownerId = (familyGroup.getCreatedBy() != null)
                ? familyGroup.getCreatedBy().getId()
                : null;
        return toMemberResponse(savedUser, ownerId);
    }

    /**
     * Nâng cấp tài khoản cá nhân lên Chủ hộ (FAMILY_ADMIN) và khởi tạo nhóm hộ gia đình mới.
     */
    public java.util.Map<String, Object> upgradeToFamilyAdmin(Long currentUserId, String familyName) {
        User currentUser = getCurrentUser(currentUserId);
        if (currentUser.getRole() == Role.SYSTEM_ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quản trị viên hệ thống không thuộc nhóm hộ gia đình");
        }
        String trimmedName = (familyName == null || familyName.isBlank())
                ? ("Gia đình của " + currentUser.getFullName())
                : familyName.trim();

        if (currentUser.getFamilyGroupId() != null && !currentUser.getFamilyGroupId().isBlank()) {
            var existingGroup = familyGroupRepository.findById(currentUser.getFamilyGroupId()).orElse(null);
            if (existingGroup != null) {
                if (currentUser.getRole() != Role.FAMILY_ADMIN) {
                    currentUser.setRole(Role.FAMILY_ADMIN);
                    userRepository.save(currentUser);
                }
                return java.util.Map.of(
                        "familyGroupId", existingGroup.getId(),
                        "familyGroupName", existingGroup.getName(),
                        "role", Role.FAMILY_ADMIN.name()
                );
            }
        }

        String groupId;
        do {
            groupId = "BG-" + java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase(java.util.Locale.ROOT);
        } while (familyGroupRepository.existsById(groupId));

        familyGroupRepository.save(FamilyGroup.builder()
                .id(groupId)
                .name(trimmedName)
                .createdBy(currentUser)
                .build());

        currentUser.setRole(Role.FAMILY_ADMIN);
        currentUser.setFamilyGroupId(groupId);
        userRepository.save(currentUser);

        return java.util.Map.of(
                "familyGroupId", groupId,
                "familyGroupName", trimmedName,
                "role", Role.FAMILY_ADMIN.name()
        );
    }

}
