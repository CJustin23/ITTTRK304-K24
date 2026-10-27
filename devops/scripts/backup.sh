#!/bin/bash
# ==============================================================================
# AUTO BACKUP SCRIPT FOR BUDGLEE PLATFORM DATABASE
# Phụ trách: Lê Hoàng Xuân Vinh (DevOps & QA Lead)
# Nhiệm vụ: Tự động sao lưu MySQL định kỳ, nén .sql.gz và giữ 07 bản mới nhất
# ==============================================================================

set -e

# Đọc cấu hình từ biến môi trường hoặc dùng mặc định
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-budglee_db}"
DB_USER="${DB_USER:-budglee_user}"
DB_PASSWORD="${DB_PASSWORD:-budglee_secret}"

BACKUP_DIR="${BACKUP_DIR:-/backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/budglee_backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=7

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Bắt đầu tiến trình sao lưu database '${DB_NAME}'..."

# Thực hiện mysqldump và nén gzip
mysqldump -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" -p"${DB_PASSWORD}" \
  --single-transaction --quick --routines --triggers "${DB_NAME}" | gzip > "${BACKUP_FILE}"

if [ -f "${BACKUP_FILE}" ]; then
    FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "[$(date)] Sao lưu thành công: ${BACKUP_FILE} (${FILE_SIZE})"
else
    echo "[$(date)] [LỖI] Không thể tạo file sao lưu!" >&2
    exit 1
fi

# Xóa các bản backup cũ hơn 7 ngày
echo "[$(date)] Dọn dẹp bản sao lưu cũ quá ${RETENTION_DAYS} ngày..."
find "${BACKUP_DIR}" -type f -name "budglee_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -exec rm -f {} \;

echo "[$(date)] Hoàn tất quy trình sao lưu an toàn."
