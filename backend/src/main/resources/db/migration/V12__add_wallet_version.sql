-- DUAN-50: khoa phien ban cho vi, de hai giao dịch dong thoi tren cung mot vi khong mat lan tru tien
-- Viet boi Nguyen Truong An (Backend Lead). Hop voi ca MySQL lan H2.

ALTER TABLE wallets
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
