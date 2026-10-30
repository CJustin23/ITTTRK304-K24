-- Normalize enum-like columns to match V1 and JPA entities.

ALTER TABLE users
    MODIFY COLUMN role VARCHAR(50) NOT NULL DEFAULT 'INDIVIDUAL_USER';

ALTER TABLE wallets
    MODIFY COLUMN type VARCHAR(30) NOT NULL DEFAULT 'CASH';

ALTER TABLE categories
    MODIFY COLUMN type VARCHAR(20) NOT NULL;

ALTER TABLE transactions
    MODIFY COLUMN transaction_type VARCHAR(20) NOT NULL;

ALTER TABLE saving_goals
    MODIFY COLUMN status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS';


-- Insert default system categories without duplicating existing ones.

INSERT INTO categories (name, type, icon, color_code, user_id)
SELECT 'Food & Drinks', 'EXPENSE', 'Utensils', '#F59E0B', NULL
    WHERE NOT EXISTS (
    SELECT 1 FROM categories
    WHERE name = 'Food & Drinks'
      AND type = 'EXPENSE'
      AND user_id IS NULL
);

INSERT INTO categories (name, type, icon, color_code, user_id)
SELECT 'Shopping', 'EXPENSE', 'ShoppingBag', '#EC4899', NULL
    WHERE NOT EXISTS (
    SELECT 1 FROM categories
    WHERE name = 'Shopping'
      AND type = 'EXPENSE'
      AND user_id IS NULL
);

INSERT INTO categories (name, type, icon, color_code, user_id)
SELECT 'Travel & Transport', 'EXPENSE', 'Car', '#3B82F6', NULL
    WHERE NOT EXISTS (
    SELECT 1 FROM categories
    WHERE name = 'Travel & Transport'
      AND type = 'EXPENSE'
      AND user_id IS NULL
);

INSERT INTO categories (name, type, icon, color_code, user_id)
SELECT 'Health', 'EXPENSE', 'Heart', '#EF4444', NULL
    WHERE NOT EXISTS (
    SELECT 1 FROM categories
    WHERE name = 'Health'
      AND type = 'EXPENSE'
      AND user_id IS NULL
);

INSERT INTO categories (name, type, icon, color_code, user_id)
SELECT 'Bills & Utilities', 'EXPENSE', 'Receipt', '#8B5CF6', NULL
    WHERE NOT EXISTS (
    SELECT 1 FROM categories
    WHERE name = 'Bills & Utilities'
      AND type = 'EXPENSE'
      AND user_id IS NULL
);

INSERT INTO categories (name, type, icon, color_code, user_id)
SELECT 'Education', 'EXPENSE', 'BookOpen', '#06B6D4', NULL
    WHERE NOT EXISTS (
    SELECT 1 FROM categories
    WHERE name = 'Education'
      AND type = 'EXPENSE'
      AND user_id IS NULL
);

INSERT INTO categories (name, type, icon, color_code, user_id)
SELECT 'Salary', 'INCOME', 'Wallet', '#22C55E', NULL
    WHERE NOT EXISTS (
    SELECT 1 FROM categories
    WHERE name = 'Salary'
      AND type = 'INCOME'
      AND user_id IS NULL
);

INSERT INTO categories (name, type, icon, color_code, user_id)
SELECT 'Investment', 'INCOME', 'TrendingUp', '#10B981', NULL
    WHERE NOT EXISTS (
    SELECT 1 FROM categories
    WHERE name = 'Investment'
      AND type = 'INCOME'
      AND user_id IS NULL
);

INSERT INTO categories (name, type, icon, color_code, user_id)
SELECT 'Other Income', 'INCOME', 'CircleDollarSign', '#14B8A6', NULL
    WHERE NOT EXISTS (
    SELECT 1 FROM categories
    WHERE name = 'Other Income'
      AND type = 'INCOME'
      AND user_id IS NULL
);

INSERT INTO categories (name, type, icon, color_code, user_id)
SELECT 'Other', 'EXPENSE', 'Ellipsis', '#64748B', NULL
    WHERE NOT EXISTS (
    SELECT 1 FROM categories
    WHERE name = 'Other'
      AND type = 'EXPENSE'
      AND user_id IS NULL
);