-- DUAN-53: Create family invitations
-- Phu trach: Bang Trong Tu

CREATE TABLE family_invitations (
    id BIGINT NOT NULL AUTO_INCREMENT,
    family_group_id VARCHAR(50) NOT NULL,
    invited_by BIGINT NOT NULL,
    invitee_user_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    responded_at TIMESTAMP NULL DEFAULT NULL,

    PRIMARY KEY (id),

    CONSTRAINT fk_family_invitations_family_group
        FOREIGN KEY (family_group_id)
        REFERENCES family_groups(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_family_invitations_invited_by
        FOREIGN KEY (invited_by)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_family_invitations_invitee
        FOREIGN KEY (invitee_user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_family_invitations_status
        CHECK (status IN (
            'PENDING',
            'ACCEPTED',
            'REJECTED',
            'EXPIRED',
            'CANCELLED'
        )),

    INDEX idx_family_invitations_group_status
        (family_group_id, status),

    INDEX idx_family_invitations_invitee_status
        (invitee_user_id, status),

    INDEX idx_family_invitations_expires_at
        (expires_at)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
