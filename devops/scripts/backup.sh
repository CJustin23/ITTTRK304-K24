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

# Kiểm tra dependency
for cmd in mysqldump gzip find sort; do
    command -v "$cmd" >/dev/null 2>&1 || {
        echo "[$(date)] [ERROR] Thiếu lệnh: $cmd" >&2
        exit 1
    }
done

# Không cho phép chạy với mật khẩu mặc định rỗng
if [[ -z "$DB_PASSWORD" ]]; then
    echo "[$(date)] [ERROR] Chưa cấu hình DB_PASSWORD!" >&2
    exit 1
fi

mkdir -p "$BACKUP_DIR"

# Xóa file chưa hoàn chỉnh nếu quá trình backup thất bại
cleanup() {
    if [[ -n "${BACKUP_FILE:-}" && -f "$BACKUP_FILE" ]]; then
        rm -f -- "$BACKUP_FILE"
    fi
}
trap cleanup ERR

echo "[$(date)] Bắt đầu backup database: ${DB_NAME}"

# MYSQL_PWD tránh ghi mật khẩu trực tiếp trong tham số -p.
# Lưu ý: nên dùng file cấu hình client được bảo vệ hoặc Docker secrets
# khi triển khai production.
export MYSQL_PWD="$DB_PASSWORD"

mysqldump \
    -h "$DB_HOST" \
    -P "$DB_PORT" \
    -u "$DB_USER" \
    --single-transaction \
    --quick \
    --routines \
    --triggers \
    --events \
    "$DB_NAME" | gzip -c > "$BACKUP_FILE"

unset MYSQL_PWD

# Kiểm tra file backup
if [[ ! -s "$BACKUP_FILE" ]]; then
    echo "[$(date)] [ERROR] File backup rỗng hoặc không tồn tại!" >&2
    exit 1
fi

gzip -t "$BACKUP_FILE"

FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date)] Backup thành công: $BACKUP_FILE ($FILE_SIZE)"

# Giữ lại đúng 7 bản backup mới nhất
mapfile -t BACKUPS < <(
    find "$BACKUP_DIR" -maxdepth 1 -type f \
        -name 'budglee_backup_*.sql.gz' \
        -printf '%T@ %p\n' |
    sort -nr |
    cut -d' ' -f2-
)

if (( ${#BACKUPS[@]} > RETENTION_COUNT )); then
    for old_backup in "${BACKUPS[@]:RETENTION_COUNT}"; do
        rm -f -- "$old_backup"
        echo "[$(date)] Đã xóa backup cũ: $old_backup"
    done
fi

trap - ERR
echo "[$(date)] Hoàn tất quy trình backup."