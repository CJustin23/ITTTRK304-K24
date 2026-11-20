-- Flyway Migration V11:
-- Add composite indexes for frequent transaction lookup and dashboard aggregation.

CREATE INDEX idx_tx_wallet_date
    ON transactions (wallet_id, transaction_date);

CREATE INDEX idx_tx_user_type_linked_date
    ON transactions (user_id, transaction_type, linked_transaction_id, transaction_date);
