-- Flyway Migration V15:
-- Add composite index on category, user, type and date for reporting and budget aggregation.
-- Sprint 4: Bang Trong Tu (Database & Data Lead)

CREATE INDEX idx_tx_report_category
    ON transactions (user_id, transaction_type, linked_transaction_id, category_id, transaction_date);

