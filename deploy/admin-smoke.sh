#!/usr/bin/env bash
# Run against a deployed demo: set URL, ADMIN_EMAIL/PASSWORD and USER_EMAIL/PASSWORD.
set -Eeuo pipefail

BASE_URL="${BASE_URL:-http://localhost}"
: "${ADMIN_EMAIL:?Set ADMIN_EMAIL}"
: "${ADMIN_PASSWORD:?Set ADMIN_PASSWORD}"
: "${USER_EMAIL:?Set USER_EMAIL}"
: "${USER_PASSWORD:?Set USER_PASSWORD}"

login() {
  local email="$1" password="$2" response
  response=$(curl -fsS -X POST "$BASE_URL/api/v1/auth/login" -H 'Content-Type: application/json' \
    --data "$(EMAIL_VALUE="$email" PASSWORD_VALUE="$password" python3 -c 'import json,os; print(json.dumps({"email":os.environ["EMAIL_VALUE"],"password":os.environ["PASSWORD_VALUE"]}))')")
  printf '%s' "$response" | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["token"])'
}

admin_token=$(login "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
user_token=$(login "$USER_EMAIL" "$USER_PASSWORD")

expect_status() {
  local expected="$1" path="$2" token="$3" actual
  actual=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE_URL$path" -H "Authorization: Bearer $token")
  if [[ "$actual" != "$expected" ]]; then
    echo "FAIL $path expected HTTP $expected, received $actual" >&2
    exit 1
  fi
  echo "PASS $path -> HTTP $actual"
}

expect_status 200 /api/v1/admin/users "$admin_token"
expect_status 200 /api/v1/admin/stats "$admin_token"
expect_status 200 /api/v1/admin/chatbot-keys "$admin_token"
expect_status 200 /api/v1/admin/backups "$admin_token"
expect_status 403 /api/v1/admin/users "$user_token"
expect_status 403 /api/v1/admin/stats "$user_token"
expect_status 403 /api/v1/admin/chatbot-keys "$user_token"
expect_status 403 /api/v1/admin/backups "$user_token"
echo "Admin/regular-user RBAC smoke checks passed."
