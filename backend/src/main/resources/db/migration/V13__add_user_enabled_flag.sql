-- DUAN-40: trang thai hoat dong cua tai khoan de quan tri co the khoa nguoi dung
-- Viet boi Nguyen Truong An (Backend Lead). Hop voi ca MySQL lan H2.

ALTER TABLE users
    ADD COLUMN enabled BOOLEAN NOT NULL DEFAULT TRUE;
