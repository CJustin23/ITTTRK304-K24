-- ==========================================================
-- Budglee: Demo seed data
-- Database & Data Lead
-- Demo password: password (development only)
-- Safe to run once through Flyway.
-- ==========================================================

-- 1. Create demo FAMILY_ADMIN account if it does not exist.

INSERT INTO users (
    full_name,
    email,
    password_hash,
    role,
    family_group_id
)
SELECT
    'Budglee Demo User',
    'seed.user@budglee.local',
    '$2a$10$cgBJwkzu6UwxqBcjo/pVv.nTXz1Qm1QToqaTuWFaHsKWM.6nNtG3a',
    'FAMILY_ADMIN',
    NULL
    WHERE NOT EXISTS (
    SELECT 1
    FROM users
    WHERE email = 'seed.user@budglee.local'
);

UPDATE users
SET
    password_hash = '$2a$10$cgBJwkzu6UwxqBcjo/pVv.nTXz1Qm1QToqaTuWFaHsKWM.6nNtG3a',
    role = 'FAMILY_ADMIN'
WHERE email = 'seed.user@budglee.local';


-- 2. Create demo family group.

INSERT INTO family_groups (
    id,
    name,
    created_by
)
SELECT
    'FAMILY_TU_001',
    'Gia dinh Budglee',
    u.id
FROM users u
WHERE u.email = 'seed.user@budglee.local'
  AND NOT EXISTS (
    SELECT 1
    FROM family_groups fg
    WHERE fg.id = 'FAMILY_TU_001'
);

UPDATE users
SET family_group_id = 'FAMILY_TU_001'
WHERE email = 'seed.user@budglee.local';


-- 3. Create demo categories.

INSERT INTO categories (name, type, icon, color_code, user_id)
SELECT 'Seed Salary', 'INCOME', 'Wallet', '#22C55E', u.id
FROM users u
WHERE u.email = 'seed.user@budglee.local'
  AND NOT EXISTS (
    SELECT 1
    FROM categories c
    WHERE c.user_id = u.id
      AND c.name = 'Seed Salary'
      AND c.type = 'INCOME'
);

INSERT INTO categories (name, type, icon, color_code, user_id)
SELECT 'Seed Opening Balance', 'INCOME', 'Coins', '#16A34A', u.id
FROM users u
WHERE u.email = 'seed.user@budglee.local'
  AND NOT EXISTS (
    SELECT 1
    FROM categories c
    WHERE c.user_id = u.id
      AND c.name = 'Seed Opening Balance'
      AND c.type = 'INCOME'
);

INSERT INTO categories (name, type, icon, color_code, user_id)
SELECT 'Seed Food', 'EXPENSE', 'Utensils', '#F59E0B', u.id
FROM users u
WHERE u.email = 'seed.user@budglee.local'
  AND NOT EXISTS (
    SELECT 1
    FROM categories c
    WHERE c.user_id = u.id
      AND c.name = 'Seed Food'
      AND c.type = 'EXPENSE'
);

INSERT INTO categories (name, type, icon, color_code, user_id)
SELECT 'Seed Transport', 'EXPENSE', 'Car', '#3B82F6', u.id
FROM users u
WHERE u.email = 'seed.user@budglee.local'
  AND NOT EXISTS (
    SELECT 1
    FROM categories c
    WHERE c.user_id = u.id
      AND c.name = 'Seed Transport'
      AND c.type = 'EXPENSE'
);


-- 4. Create demo wallets.

INSERT INTO wallets (
    user_id,
    family_group_id,
    wallet_name,
    balance,
    currency,
    type
)
SELECT
    u.id,
    u.family_group_id,
    'Seed Cash Wallet',
    1670000.00,
    'VND',
    'CASH'
FROM users u
WHERE u.email = 'seed.user@budglee.local'
  AND NOT EXISTS (
    SELECT 1
    FROM wallets w
    WHERE w.user_id = u.id
      AND w.wallet_name = 'Seed Cash Wallet'
);

INSERT INTO wallets (
    user_id,
    family_group_id,
    wallet_name,
    balance,
    currency,
    type
)
SELECT
    u.id,
    u.family_group_id,
    'Seed Bank Account',
    15000000.00,
    'VND',
    'BANK'
FROM users u
WHERE u.email = 'seed.user@budglee.local'
  AND NOT EXISTS (
    SELECT 1
    FROM wallets w
    WHERE w.user_id = u.id
      AND w.wallet_name = 'Seed Bank Account'
);


-- 5. Create demo transactions.

INSERT INTO transactions (
    wallet_id,
    category_id,
    user_id,
    action_title,
    amount,
    transaction_type,
    balance_after,
    transaction_date,
    note
)
SELECT
    w.id,
    c.id,
    u.id,
    'Seed: Opening balance',
    2000000.00,
    'INCOME',
    2000000.00,
    '2026-10-01 08:00:00',
    'Demo opening cash balance'
FROM users u
         JOIN wallets w
              ON w.user_id = u.id
                  AND w.wallet_name = 'Seed Cash Wallet'
         JOIN categories c
              ON c.user_id = u.id
                  AND c.name = 'Seed Opening Balance'
                  AND c.type = 'INCOME'
WHERE u.email = 'seed.user@budglee.local'
  AND NOT EXISTS (
    SELECT 1
    FROM transactions t
    WHERE t.user_id = u.id
      AND t.action_title = 'Seed: Opening balance'
      AND t.transaction_date = '2026-10-01 08:00:00'
);

INSERT INTO transactions (
    wallet_id,
    category_id,
    user_id,
    action_title,
    amount,
    transaction_type,
    balance_after,
    transaction_date,
    note
)
SELECT
    w.id,
    c.id,
    u.id,
    'Seed: Grocery shopping',
    250000.00,
    'EXPENSE',
    1750000.00,
    '2026-10-02 18:00:00',
    'Demo food expense'
FROM users u
         JOIN wallets w
              ON w.user_id = u.id
                  AND w.wallet_name = 'Seed Cash Wallet'
         JOIN categories c
              ON c.user_id = u.id
                  AND c.name = 'Seed Food'
                  AND c.type = 'EXPENSE'
WHERE u.email = 'seed.user@budglee.local'
  AND NOT EXISTS (
    SELECT 1
    FROM transactions t
    WHERE t.user_id = u.id
      AND t.action_title = 'Seed: Grocery shopping'
      AND t.transaction_date = '2026-10-02 18:00:00'
);

INSERT INTO transactions (
    wallet_id,
    category_id,
    user_id,
    action_title,
    amount,
    transaction_type,
    balance_after,
    transaction_date,
    note
)
SELECT
    w.id,
    c.id,
    u.id,
    'Seed: Transportation',
    80000.00,
    'EXPENSE',
    1670000.00,
    '2026-10-03 07:30:00',
    'Demo transportation expense'
FROM users u
         JOIN wallets w
              ON w.user_id = u.id
                  AND w.wallet_name = 'Seed Cash Wallet'
         JOIN categories c
              ON c.user_id = u.id
                  AND c.name = 'Seed Transport'
                  AND c.type = 'EXPENSE'
WHERE u.email = 'seed.user@budglee.local'
  AND NOT EXISTS (
    SELECT 1
    FROM transactions t
    WHERE t.user_id = u.id
      AND t.action_title = 'Seed: Transportation'
      AND t.transaction_date = '2026-10-03 07:30:00'
);

INSERT INTO transactions (
    wallet_id,
    category_id,
    user_id,
    action_title,
    amount,
    transaction_type,
    balance_after,
    transaction_date,
    note
)
SELECT
    w.id,
    c.id,
    u.id,
    'Seed: Monthly salary',
    15000000.00,
    'INCOME',
    15000000.00,
    '2026-10-05 09:00:00',
    'Demo monthly salary'
FROM users u
         JOIN wallets w
              ON w.user_id = u.id
                  AND w.wallet_name = 'Seed Bank Account'
         JOIN categories c
              ON c.user_id = u.id
                  AND c.name = 'Seed Salary'
                  AND c.type = 'INCOME'
WHERE u.email = 'seed.user@budglee.local'
  AND NOT EXISTS (
    SELECT 1
    FROM transactions t
    WHERE t.user_id = u.id
      AND t.action_title = 'Seed: Monthly salary'
      AND t.transaction_date = '2026-10-05 09:00:00'
);


-- 6. Create demo monthly food budget.

INSERT INTO budgets (
    user_id,
    category_id,
    amount_limit,
    spent_amount,
    period_month,
    period_year,
    alert_threshold
)
SELECT
    u.id,
    c.id,
    3000000.00,
    250000.00,
    10,
    2026,
    80.00
FROM users u
         JOIN categories c
              ON c.user_id = u.id
                  AND c.name = 'Seed Food'
                  AND c.type = 'EXPENSE'
WHERE u.email = 'seed.user@budglee.local'
  AND NOT EXISTS (
    SELECT 1
    FROM budgets b
    WHERE b.user_id = u.id
      AND b.category_id = c.id
      AND b.period_month = 10
      AND b.period_year = 2026
);


-- 7. Create demo saving goal.

INSERT INTO saving_goals (
    user_id,
    goal_name,
    target_amount,
    current_amount,
    deadline,
    status
)
SELECT
    u.id,
    'Seed Emergency Fund',
    20000000.00,
    5000000.00,
    '2027-12-31',
    'IN_PROGRESS'
FROM users u
WHERE u.email = 'seed.user@budglee.local'
  AND NOT EXISTS (
    SELECT 1
    FROM saving_goals g
    WHERE g.user_id = u.id
      AND g.goal_name = 'Seed Emergency Fund'
);
