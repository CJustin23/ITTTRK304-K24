-- ==========================================================
-- Budglee: Seed data for local development
-- Database & Data Lead
-- Demo password: password (development only)
-- This script does not delete existing records.
-- ==========================================================

-- USE budglee_db;

-- 1. Create a demo user if it does not exist.
-- The password hash is BCrypt for the development password "password".
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
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'INDIVIDUAL_USER',
    NULL
    WHERE NOT EXISTS (
    SELECT 1
    FROM users
    WHERE email = 'seed.user@budglee.local'
);

-- 2. Create demo categories for the demo user.
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

-- 3. Create demo wallets.
INSERT INTO wallets (
    user_id,
    wallet_name,
    balance,
    currency,
    type
)
SELECT
    u.id,
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
    wallet_name,
    balance,
    currency,
    type
)
SELECT
    u.id,
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

-- 4. Create demo transactions.
-- Opening cash balance: 2,000,000 VND.
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

-- 5. Create a demo monthly food budget.
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

-- 6. Create a demo saving goal.
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

-- 7. Verify the demo data.
SELECT 'users' AS table_name, COUNT(*) AS seed_count
FROM users
WHERE email = 'seed.user@budglee.local'
UNION ALL
SELECT 'wallets', COUNT(*)
FROM wallets w
         JOIN users u ON u.id = w.user_id
WHERE u.email = 'seed.user@budglee.local'
UNION ALL
SELECT 'categories', COUNT(*)
FROM categories c
         JOIN users u ON u.id = c.user_id
WHERE u.email = 'seed.user@budglee.local'
UNION ALL
SELECT 'transactions', COUNT(*)
FROM transactions t
         JOIN users u ON u.id = t.user_id
WHERE u.email = 'seed.user@budglee.local'
UNION ALL
SELECT 'budgets', COUNT(*)
FROM budgets b
         JOIN users u ON u.id = b.user_id
WHERE u.email = 'seed.user@budglee.local'
UNION ALL
SELECT 'saving_goals', COUNT(*)
FROM saving_goals g
         JOIN users u ON u.id = g.user_id
WHERE u.email = 'seed.user@budglee.local';
