
#!/usr/bin/env bash
set -Eeuo pipefail

# ==========================================
# Budglee - Restore Drill
# Khôi phục backup vào database kiểm thử riêng
# Không ghi đè budglee_db
# ==========================================

# Cách chạy:
# ./restore.sh /path/to/budglee_db_backup.sql.gz

BACKUP_FILE="${1:-}"
MYSQL_CNF="${MYSQL_CNF:-$HOME/.my.cnf}"
MYSQL_HOST="${MYSQL_HOST:-localhost}"
MYSQL_PORT="${MYSQL_PORT:-3306}"

# Tên database kiểm thử tự sinh theo thời gian
RESTORE_DB="budglee_restore_drill_$(date +%Y%m%d_%H%M%S)"

# Kiểm tra tham số
if [[ -z "$BACKUP_FILE" ]]; then
    echo "Usage: $0 /path/to/backup.sql.gz"
    exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
    echo "ERROR: Không tìm thấy file backup: $BACKUP_FILE"
    exit 1
fi

if [[ ! -f "$MYSQL_CNF" ]]; then
    echo "ERROR: Không tìm thấy file cấu hình MySQL: $MYSQL_CNF"
    echo "Hãy tạo ~/.my.cnf với thông tin đăng nhập MySQL."
    exit 1
fi

if ! command -v mysql >/dev/null 2>&1; then
    echo "ERROR: Chưa cài đặt MySQL client."
    exit 1
fi

if ! command -v gzip >/dev/null 2>&1; then
    echo "ERROR: Chưa cài đặt gzip."
    exit 1
fi

# Kiểm tra tính toàn vẹn của file nén
echo "[1/5] Kiểm tra file backup..."
if ! gzip -t "$BACKUP_FILE"; then
    echo "ERROR: File backup bị lỗi hoặc không phải gzip hợp lệ."
    exit 1
fi

MYSQL_ARGS=(
    "--defaults-extra-file=$MYSQL_CNF"
    "--host=$MYSQL_HOST"
    "--port=$MYSQL_PORT"
    "--default-character-set=utf8mb4"
)

echo "[2/5] Kiểm tra kết nối MySQL..."
mysql "${MYSQL_ARGS[@]}" \
    --execute="SELECT VERSION();" >/dev/null

echo "[3/5] Tạo database kiểm thử: $RESTORE_DB"

mysql "${MYSQL_ARGS[@]}" --execute="
CREATE DATABASE \`$RESTORE_DB\`
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
"

echo "[4/5] Đang khôi phục dữ liệu..."

# Loại bỏ CREATE DATABASE và USE từ file dump
# để dữ liệu được nhập vào database kiểm thử.
if ! gzip -dc "$BACKUP_FILE" |
    sed -E \
        -e '/^[[:space:]]*CREATE DATABASE([[:space:]]|`)/Id' \
        -e '/^[[:space:]]*USE[[:space:]]/Id' |
    mysql "${MYSQL_ARGS[@]}" "$RESTORE_DB"; then

    echo "ERROR: Khôi phục thất bại."
    echo "Database kiểm thử có thể đã được tạo một phần: $RESTORE_DB"
    echo "Không tự động xóa database để giữ lại dữ liệu phục vụ kiểm tra."
    exit 1
fi

echo "[5/5] Kiểm tra kết quả khôi phục..."

TABLE_COUNT=$(
    mysql "${MYSQL_ARGS[@]}" \
        --batch --skip-column-names \
        --execute="
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = '$RESTORE_DB'
              AND table_type = 'BASE TABLE';
        "
)

echo
echo "========== RESTORE RESULT =========="
echo "Backup file : $BACKUP_FILE"
echo "Database    : $RESTORE_DB"
echo "Tables      : $TABLE_COUNT"
echo "Status      : SUCCESS"
echo "===================================="

echo
echo "Danh sách bảng:"
mysql "${MYSQL_ARGS[@]}" \
    --execute="SHOW TABLES FROM \`$RESTORE_DB\`;"

echo
