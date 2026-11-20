-- Flyway Migration V18: Seed Savings & Goals category and fix existing goal deposit transactions
-- Sprint 4: Bang Trong Tu (Database & Backend)

INSERT INTO categories (name, type, icon, color_code, user_id)
SELECT 'Savings & Goals', 'EXPENSE', 'PiggyBank', '#10B981', NULL
WHERE NOT EXISTS (
    SELECT 1 FROM categories WHERE name = 'Savings & Goals' AND type = 'EXPENSE' AND user_id IS NULL
);

-- Cập nhật các giao dịch nạp tiền tích lũy / khởi tạo mục tiêu trước đó đang bị gán nhầm vào category Ăn uống (hoặc category khác)
UPDATE transactions
SET category_id = (
    SELECT id FROM categories
    WHERE name = 'Savings & Goals' AND type = 'EXPENSE' AND user_id IS NULL
    LIMIT 1
)
WHERE action_title LIKE 'Nạp tiền tích lũy%'
   OR action_title LIKE 'Khởi tạo mục tiêu%';
