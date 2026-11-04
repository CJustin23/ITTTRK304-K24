-- ==========================================================
-- Budglee: Fix demo wallet family group relationship
-- Database & Data Lead
-- ==========================================================

UPDATE wallets w
JOIN users u ON w.user_id = u.id
SET w.family_group_id = u.family_group_id
WHERE u.email = 'seed.user@budglee.local'
    AND w.wallet_name IN (
    'Seed Cash Wallet',
    'Seed Bank Account'
    )
    AND u.family_group_id IS NOT NULL;
