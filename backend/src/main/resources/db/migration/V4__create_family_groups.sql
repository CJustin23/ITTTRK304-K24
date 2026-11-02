
-- DUAN-53: Create family_groups table
-- Phu trach: Bang Trong Tu

CREATE TABLE family_groups (
    id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_family_groups_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

ALTER TABLE users
    ADD CONSTRAINT fk_users_family_group
    FOREIGN KEY (family_group_id)
    REFERENCES family_groups(id)
    ON DELETE SET NULL;

ALTER TABLE wallets
    ADD CONSTRAINT fk_wallets_family_group
    FOREIGN KEY (family_group_id)
    REFERENCES family_groups(id)
    ON DELETE SET NULL;
