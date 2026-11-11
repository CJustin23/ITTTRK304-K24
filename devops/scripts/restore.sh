#!/usr/bin/env bash
set -Eeuo pipefail

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-budglee_db}"
DB_USER="${DB_USER:-budglee_user}"
DB_PASSWORD="${DB_PASSWORD:-}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
BACKUP_NAME="${1:-}"

if [[ ! "$BACKUP_NAME" =~ ^budglee_backup_[0-9]{8}_[0-9]{6}\.sql\.gz$ ]]; then
  echo "Invalid backup name" >&2
  exit 2
fi
BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}"
if [[ ! -f "$BACKUP_FILE" || ! -s "$BACKUP_FILE" ]]; then
  echo "Backup file not found or empty" >&2
  exit 3
fi
if [[ -z "$DB_PASSWORD" ]]; then
  echo "DB_PASSWORD is not configured" >&2
  exit 4
fi
if command -v mysql >/dev/null 2>&1; then
  MYSQL_CMD=mysql
elif command -v mariadb >/dev/null 2>&1; then
  MYSQL_CMD=mariadb
else
  echo "Missing mysql/mariadb client" >&2
  exit 5
fi
command -v gzip >/dev/null 2>&1 || { echo "Missing gzip" >&2; exit 5; }
gzip -t "$BACKUP_FILE"
export MYSQL_PWD="$DB_PASSWORD"
gzip -dc -- "$BACKUP_FILE" | "$MYSQL_CMD" -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME"
unset MYSQL_PWD
echo "Restore successful: ${BACKUP_NAME}"
