-- Flyway Migration V17: Seed Entertainment category for budget & transaction categorization
-- Sprint 4: Bang Trong Tu (Database & Backend)

INSERT INTO categories (name, type, icon, color_code, user_id)
SELECT 'Entertainment', 'EXPENSE', 'Plane', '#EC4899', NULL
WHERE NOT EXISTS (
    SELECT 1 FROM categories WHERE name = 'Entertainment' AND type = 'EXPENSE' AND user_id IS NULL
);
