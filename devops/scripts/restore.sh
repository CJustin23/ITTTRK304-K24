#!/usr/bin/env bash
set -Eeuo pipefail

# ==========================================
# Budglee - Restore Script
# Hỗ trợ cả môi trường Docker/VPS (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)
# lẫn môi trường chạy thủ công với ~/.my.cnf
# ==========================================

RAW_ARG="${1:-}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
DB_HOST="${DB_HOST:-${MYSQL_HOST:-localhost}}"
DB_PORT="${DB_PORT:-${MYSQL_PORT:-3306}}"
DB_NAME="${DB_NAME:-budglee_db}"
DB_USER="${DB_USER:-budglee_user}"
DB_PASSWORD="${DB_PASSWORD:-}"
MYSQL_CNF="${MYSQL_CNF:-$HOME/.my.cnf}"

if [[ -z "$RAW_ARG" ]]; then
    echo "Usage: $0 <backup-file.sql.gz>" >&2
    exit 1
fi

if [[ -f "$RAW_ARG" ]]; then
    BACKUP_FILE="$RAW_ARG"
elif [[ -f "${BACKUP_DIR}/${RAW_ARG}" ]]; then
    BACKUP_FILE="${BACKUP_DIR}/${RAW_ARG}"
else
    echo "ERROR: Không tìm thấy file backup: $RAW_ARG" >&2
    exit 1
fi

if command -v mysql >/dev/null 2>&1; then
    MYSQL_CMD=mysql
elif command -v mariadb >/dev/null 2>&1; then
    MYSQL_CMD=mariadb
else
    echo "ERROR: Chưa cài đặt MySQL/MariaDB client." >&2
    exit 1
fi

if ! command -v gzip >/dev/null 2>&1; then
    echo "ERROR: Chưa cài đặt gzip." >&2
    exit 1
fi

echo "[1/3] Kiểm tra tính toàn vẹn file backup..."
if ! gzip -t "$BACKUP_FILE"; then
    echo "ERROR: File backup bị lỗi hoặc không phải định dạng gzip hợp lệ." >&2
    exit 1
fi

MYSQL_ARGS=(
    "--host=$DB_HOST"
    "--port=$DB_PORT"
    "--protocol=TCP"
    "--default-character-set=utf8mb4"
)

if [[ -n "$DB_PASSWORD" ]]; then
    export MYSQL_PWD="$DB_PASSWORD"
    MYSQL_ARGS+=("--user=$DB_USER")
elif [[ -f "$MYSQL_CNF" ]]; then
    MYSQL_ARGS=("--defaults-extra-file=$MYSQL_CNF" "${MYSQL_ARGS[@]}")
else
    echo "ERROR: Thiếu DB_PASSWORD hoặc file cấu hình $MYSQL_CNF" >&2
    exit 1
fi

echo "[2/3] Đang khôi phục dữ liệu vào database $DB_NAME..."
if ! gzip -dc "$BACKUP_FILE" |
    sed -E \
        -e '/^[[:space:]]*CREATE DATABASE([[:space:]]|`)/Id' \
        -e '/^[[:space:]]*USE[[:space:]]/Id' |
    "$MYSQL_CMD" "${MYSQL_ARGS[@]}" "$DB_NAME"; then
    unset MYSQL_PWD
    echo "ERROR: Khôi phục thất bại." >&2
    exit 1
fi

unset MYSQL_PWD
echo "[3/3] Khôi phục hoàn tất từ file: $BACKUP_FILE"
