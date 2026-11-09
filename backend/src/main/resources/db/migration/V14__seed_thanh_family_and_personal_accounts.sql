-- ==========================================================
-- Budglee: Seed 4 Production/Grading Accounts with password 123456
-- 1 Personal Account (thanhcanhan@gmail.com)
-- 3 Family Accounts (thanhba@gmail.com, thanhme@gmail.com, thanhcon@gmail.com)
-- Group: FAM-HANHPHUC ("Gia đình Hạnh Phúc")
-- Password: "123456" (BCrypt: $2a$10$JqFiRa0dy4QkNbGgXE3pBO8S1h65nzFgvVOANEBQUMtfn4lBF7/QS)
-- ==========================================================

-- 1. Personal Account: thanhcanhan@gmail.com
INSERT INTO users (full_name, email, password_hash, role, family_group_id, enabled)
SELECT 'Nguyễn Tiến Thành', 'thanhcanhan@gmail.com', '$2a$10$JqFiRa0dy4QkNbGgXE3pBO8S1h65nzFgvVOANEBQUMtfn4lBF7/QS', 'INDIVIDUAL_USER', NULL, TRUE
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'thanhcanhan@gmail.com');

UPDATE users
SET password_hash = '$2a$10$JqFiRa0dy4QkNbGgXE3pBO8S1h65nzFgvVOANEBQUMtfn4lBF7/QS',
    role = 'INDIVIDUAL_USER',
    enabled = TRUE
WHERE email = 'thanhcanhan@gmail.com';

-- 2. Family Admin (Ba): thanhba@gmail.com
INSERT INTO users (full_name, email, password_hash, role, family_group_id, enabled)
SELECT 'Nguyễn Tiến Ba (Ba)', 'thanhba@gmail.com', '$2a$10$JqFiRa0dy4QkNbGgXE3pBO8S1h65nzFgvVOANEBQUMtfn4lBF7/QS', 'FAMILY_ADMIN', NULL, TRUE
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'thanhba@gmail.com');

UPDATE users
SET password_hash = '$2a$10$JqFiRa0dy4QkNbGgXE3pBO8S1h65nzFgvVOANEBQUMtfn4lBF7/QS',
    role = 'FAMILY_ADMIN',
    enabled = TRUE
WHERE email = 'thanhba@gmail.com';

-- 3. Create Family Group: FAM-HANHPHUC
INSERT INTO family_groups (id, name, created_by)
SELECT 'FAM-HANHPHUC', 'Gia đình Hạnh Phúc', u.id
FROM users u
WHERE u.email = 'thanhba@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM family_groups WHERE id = 'FAM-HANHPHUC');

-- Link Ba to family group
UPDATE users
SET family_group_id = 'FAM-HANHPHUC'
WHERE email = 'thanhba@gmail.com';

-- 4. Family Admin (Mẹ): thanhme@gmail.com
INSERT INTO users (full_name, email, password_hash, role, family_group_id, enabled)
SELECT 'Trần Thị Mẹ (Mẹ)', 'thanhme@gmail.com', '$2a$10$JqFiRa0dy4QkNbGgXE3pBO8S1h65nzFgvVOANEBQUMtfn4lBF7/QS', 'FAMILY_ADMIN', 'FAM-HANHPHUC', TRUE
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'thanhme@gmail.com');

UPDATE users
SET password_hash = '$2a$10$JqFiRa0dy4QkNbGgXE3pBO8S1h65nzFgvVOANEBQUMtfn4lBF7/QS',
    role = 'FAMILY_ADMIN',
    family_group_id = 'FAM-HANHPHUC',
    enabled = TRUE
WHERE email = 'thanhme@gmail.com';

-- 5. Family Member (Con): thanhcon@gmail.com
INSERT INTO users (full_name, email, password_hash, role, family_group_id, enabled)
SELECT 'Nguyễn Tiến Con (Con)', 'thanhcon@gmail.com', '$2a$10$JqFiRa0dy4QkNbGgXE3pBO8S1h65nzFgvVOANEBQUMtfn4lBF7/QS', 'FAMILY_MEMBER', 'FAM-HANHPHUC', TRUE
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'thanhcon@gmail.com');

UPDATE users
SET password_hash = '$2a$10$JqFiRa0dy4QkNbGgXE3pBO8S1h65nzFgvVOANEBQUMtfn4lBF7/QS',
    role = 'FAMILY_MEMBER',
    family_group_id = 'FAM-HANHPHUC',
    enabled = TRUE
WHERE email = 'thanhcon@gmail.com';
