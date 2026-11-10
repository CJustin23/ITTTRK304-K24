#!/bin/bash
# ==============================================================================
# RESTORE SCRIPT FOR BUDGLEE PLATFORM DATABASE
# Phụ trách: Lê Hoàng Xuân Vinh (DevOps & QA Lead)
# Nhiệm vụ: Khôi phục cơ sở dữ liệu MySQL từ bản sao lưu nén (.sql.gz)
# Cách dùng:
#   ./restore.sh [đường_dẫn_file_backup.sql.gz]
#   Nếu không truyền tham số, script sẽ tự động tìm bản backup mới nhất trong BACKUP_DIR.
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

# Check dependencies
for cmd in mysql gzip gunzip find sort cut; do
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

# Determine backup file to restore
if [[ $# -ge 1 && -n "$1" ]]; then
    RESTORE_FILE="$1"
else
    # Find latest backup in BACKUP_DIR
    RESTORE_FILE=$(find "$BACKUP_DIR" -maxdepth 1 -type f -name 'budglee_backup_*.sql.gz' -printf '%T@ %p\n' 2>/dev/null | sort -nr | head -n1 | cut -d' ' -f2-)
fi

if [[ -z "${RESTORE_FILE:-}" || ! -f "$RESTORE_FILE" ]]; then
    echo "[$(date)] [ERROR] No valid backup file found to restore: '${RESTORE_FILE:-none}'" >&2
    exit 1
fi

echo "[$(date)] Validating backup file integrity: $RESTORE_FILE"
gzip -t "$RESTORE_FILE" || {
    echo "[$(date)] [ERROR] Corrupt gzip archive: $RESTORE_FILE" >&2
    exit 1
}

echo "[$(date)] Starting database restore into '${DB_NAME}' from: $RESTORE_FILE"

export MYSQL_PWD="$DB_PASSWORD"

# Restore database
gunzip -c "$RESTORE_FILE" | mysql \
    -h "$DB_HOST" \
    -P "$DB_PORT" \
    -u "$DB_USER" \
    --default-character-set=utf8mb4 \
    "$DB_NAME"

unset MYSQL_PWD

echo "[$(date)] Database restore completed successfully for '${DB_NAME}'!"
