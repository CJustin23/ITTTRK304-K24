-- ==========================================================
-- Budglee: Demo FAMILY_MEMBER account
-- Database & Data Lead
-- Demo password: password (development only)
-- ==========================================================

-- Create a demo family member in the existing demo family.
-- The password hash is reused from V6.

INSERT INTO users (
    full_name,
    email,
    password_hash,
    role,
    family_group_id
)
SELECT
    'Budglee Demo Member',
    'seed.member@budglee.local',
    '$2a$10$cgBJwkzu6UwxqBcjo/pVv.nTXz1Qm1QToqaTuWFaHsKWM.6nNtG3a',
    'FAMILY_MEMBER',
    'FAMILY_TU_001'
    WHERE EXISTS (
    SELECT 1
    FROM family_groups
    WHERE id = 'FAMILY_TU_001'
)
AND NOT EXISTS (
    SELECT 1
    FROM users
    WHERE email = 'seed.member@budglee.local'
);
