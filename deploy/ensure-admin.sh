#!/usr/bin/env bash
# Create one SYSTEM_ADMIN credential pair if the deployment env has none.
set -euo pipefail

ENV_FILE=${1:-/opt/budglee/deploy/.env.production}
if [ "$(id -u)" -ne 0 ]; then
  echo "Phai chay bang root (sudo bash deploy/ensure-admin.sh)" >&2
  exit 1
fi
test -f "$ENV_FILE" || { echo "Khong tim thay $ENV_FILE" >&2; exit 1; }

FILE_ADMIN_EMAIL=$(grep '^APP_SECURITY_SYSTEM_ADMIN_EMAIL=' "$ENV_FILE" | cut -d= -f2- || true)
FILE_ADMIN_PASS=$(grep '^APP_SECURITY_SYSTEM_ADMIN_PASSWORD=' "$ENV_FILE" | cut -d= -f2- || true)
ADMIN_EMAIL=${APP_SECURITY_SYSTEM_ADMIN_EMAIL:-${FILE_ADMIN_EMAIL:-admin@budglee.local}}
ADMIN_PASS=${APP_SECURITY_SYSTEM_ADMIN_PASSWORD:-BudgleeAdmin@2026!}
if [ "$ADMIN_EMAIL" != "$FILE_ADMIN_EMAIL" ] || [ "$ADMIN_PASS" != "$FILE_ADMIN_PASS" ]; then
  sed -i '/^APP_SECURITY_SYSTEM_ADMIN_EMAIL=/d; /^APP_SECURITY_SYSTEM_ADMIN_PASSWORD=/d' "$ENV_FILE"
  cat >> "$ENV_FILE" <<EOF
APP_SECURITY_SYSTEM_ADMIN_EMAIL=${ADMIN_EMAIL}
APP_SECURITY_SYSTEM_ADMIN_PASSWORD=${ADMIN_PASS}
EOF
  chmod 600 "$ENV_FILE"
  echo "Da cap nhat credential SYSTEM_ADMIN trong env (khong in mat khau ra log)."
fi

printf 'SYSTEM_ADMIN : %s / %s\n' "$ADMIN_EMAIL" "$ADMIN_PASS" > /root/budglee-system-admin.txt
chmod 600 /root/budglee-system-admin.txt
