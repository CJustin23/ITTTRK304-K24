
package com.budglee.finance.repository;

import com.budglee.finance.entity.FamilyInvitation;
import com.budglee.finance.entity.FamilyInvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FamilyInvitationRepository extends JpaRepository<FamilyInvitation, Long> {

    // Kiểm tra lời mời đang chờ giữa gia đình và người được mời
    boolean existsByFamilyGroupIdAndInviteeIdAndStatus(
            String familyGroupId,
            Long inviteeId,
            FamilyInvitationStatus status
    );

    // Lấy danh sách lời mời đã gửi bởi một người
    List<FamilyInvitation> findByInvitedByIdOrderByCreatedAtDesc(
            Long invitedById
    );

    // Lấy danh sách lời mời đã nhận bởi một người
    List<FamilyInvitation> findByInviteeIdOrderByCreatedAtDesc(
            Long inviteeId
    );

    // Tìm lời mời theo ID và người nhận
    Optional<FamilyInvitation> findByIdAndInviteeId(
            Long id,
            Long inviteeId
    );

    // Tìm lời mời theo ID và người gửi
    Optional<FamilyInvitation> findByIdAndInvitedById(
            Long id,
            Long invitedById
    );

    // Lấy lời mời đang chờ của một gia đình
    List<FamilyInvitation> findByFamilyGroupIdAndStatus(
            String familyGroupId,
            FamilyInvitationStatus status
    );

    List<FamilyInvitation> findByFamilyGroupIdOrderByCreatedAtDesc(
            String familyGroupId
    );
}
