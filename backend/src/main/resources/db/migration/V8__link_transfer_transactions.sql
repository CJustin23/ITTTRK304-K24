-- DUAN-50: noi hai ben cua mot giao dich chuyen giua hai vi
-- Viet boi Nguyen Truong An (Backend Lead). Dung cu phap hop voi ca MySQL lan H2 (CREATE INDEX tach rieng).

ALTER TABLE transactions
    ADD COLUMN linked_transaction_id BIGINT NULL;

ALTER TABLE transactions
    ADD CONSTRAINT fk_transactions_linked_transaction
    FOREIGN KEY (linked_transaction_id)
    REFERENCES transactions(id)
    ON DELETE SET NULL;

CREATE INDEX idx_tx_linked_transaction
    ON transactions (linked_transaction_id);
