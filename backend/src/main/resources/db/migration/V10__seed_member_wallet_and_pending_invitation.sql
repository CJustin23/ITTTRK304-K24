-- Flyway Migration V10:
-- Seed wallet for FAMILY_MEMBER and a pending family invitation.

-- 1. Create a demo wallet owned by the FAMILY_MEMBER.
-- The wallet inherits the member's family_group_id so it is visible
-- to members of the same family according to WalletService.

INSERT INTO wallets (
    user_id,
    family_group_id,
    wallet_name,
    balance,
    currency,
    type
)
SELECT
    u.id,
    u.family_group_id,
    'Seed Member Cash Wallet',
    500000.00,
    'VND',
    'CASH'
FROM users u
WHERE u.email = 'seed.member@budglee.local'
  AND u.role = 'FAMILY_MEMBER'
  AND u.family_group_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM wallets w
    WHERE w.user_id = u.id
      AND w.wallet_name = 'Seed Member Cash Wallet'
);

-- 2. Create a pending invitation from FAMILY_ADMIN to an
-- INDIVIDUAL_USER who has not joined a family yet.
-- The invitation expires 7 days after this migration executes.

INSERT INTO family_invitations (
    family_group_id,
    invited_by,
    invitee_user_id,
    status,
    created_at,
    expires_at
)
SELECT
    admin.family_group_id,
    admin.id,
    invitee.id,
    'PENDING',
    CURRENT_TIMESTAMP,
    DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 7 DAY)
FROM users admin
         JOIN users invitee
              ON invitee.email = 'invitee.binh@budglee.local'
         JOIN family_groups fg
              ON fg.id = admin.family_group_id
WHERE admin.email = 'seed.user@budglee.local'
  AND admin.role = 'FAMILY_ADMIN'
  AND admin.family_group_id IS NOT NULL
  AND invitee.role = 'INDIVIDUAL_USER'
  AND invitee.family_group_id IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM family_invitations fi
    WHERE fi.family_group_id = admin.family_group_id
      AND fi.invitee_user_id = invitee.id
      AND fi.status = 'PENDING'
);
