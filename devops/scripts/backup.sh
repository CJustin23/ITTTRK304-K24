#!/bin/bash
# ==============================================================================
# AUTO BACKUP SCRIPT FOR BUDGLEE PLATFORM DATABASE
# Phụ trách: Lê Hoàng Xuân Vinh (DevOps & QA Lead)
# Nhiệm vụ: Tự động sao lưu MySQL định kỳ, nén .sql.gz và giữ 07 bản mới nhất
# ==============================================================================
set -Eeuo pipefail

# Database configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-budglee_db}"
DB_USER="${DB_USER:-budglee_user}"
DB_PASSWORD="${DB_PASSWORD:-}"

# Backup configuration
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_COUNT="${RETENTION_COUNT:-7}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/budglee_backup_${TIMESTAMP}.sql.gz"

# Check dependencies
for cmd in mysqldump gzip find sort cut du; do
    command -v "$cmd" >/dev/null 2>&1 || {
        echo "[$(date)] [ERROR] Missing command: $cmd" >&2
        exit 1
    }
done

# Check database password
if [[ -z "$DB_PASSWORD" ]]; then
    echo "[$(date)] [ERROR] DB_PASSWORD is not configured!" >&2
    exit 1
fi

mkdir -p "$BACKUP_DIR"

# Remove incomplete backup if an error occurs
cleanup() {
    if [[ -n "${BACKUP_FILE:-}" && -f "$BACKUP_FILE" ]]; then
        rm -f -- "$BACKUP_FILE"
    fi
}
trap cleanup ERR

echo "[$(date)] Starting backup: ${DB_NAME}"

export MYSQL_PWD="$DB_PASSWORD"

mysqldump
    -h "$DB_HOST"
    -P "$DB_PORT"
    -u "$DB_USER"
    --single-transaction
    --quick
    --routines
    --triggers
    --events
    "$DB_NAME" | gzip -c > "$BACKUP_FILE"

unset MYSQL_PWD

# Validate backup
if [[ ! -s "$BACKUP_FILE" ]]; then
    echo "[$(date)] [ERROR] Backup file is empty!" >&2
    exit 1
fi

gzip -t "$BACKUP_FILE"

FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)

echo "[$(date)] Backup successful: $BACKUP_FILE ($FILE_SIZE)"

# Keep only the newest 7 backups
mapfile -t BACKUPS < <(
    find "$BACKUP_DIR" -maxdepth 1 -type f
        -name 'budglee_backup_*.sql.gz'
        -printf '%T@ %p\n' |
    sort -nr |
    cut -d' ' -f2-
)

if (( ${#BACKUPS[@]} > RETENTION_COUNT )); then
    for old_backup in "${BACKUPS[@]:RETENTION_COUNT}"; do
        rm -f -- "$old_backup"
        echo "[$(date)] Removed old backup: $old_backup"
    done
fi

trap - ERR

echo "[$(date)] Backup process completed."