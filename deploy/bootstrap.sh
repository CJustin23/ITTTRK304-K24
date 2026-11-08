#!/usr/bin/env bash
# Budglee - bootstrap VPS (Ubuntu 22.04/24.04, 2GB RAM).
# Chay:  sudo bash deploy/bootstrap.sh
# Idempotent: chay lai khong pha vo cai da co. KHONG xoa volume nao.
set -euo pipefail

APP_DIR=/opt/budglee
GIT_BRANCH=${GIT_BRANCH:-develop}
ENV_FILE="$APP_DIR/deploy/.env.production"
COMPOSE="$APP_DIR/deploy/docker-compose.vps.yml"

if [ "$(id -u)" -ne 0 ]; then
  echo "Phai chay bang root (sudo bash deploy/bootstrap.sh)"; exit 1
fi

echo "== 1. Kiem tra tai nguyen =="
free -h
df -h /
DISK_FREE_GB=$(df -P / | awk 'NR==2 {print int($4/1048576)}')
if [ "$DISK_FREE_GB" -lt 10 ]; then
  echo "Thieu dia: con ${DISK_FREE_GB}GB, build 5 image can ~10GB. Nang cap cau hinh roi chay lai."
  exit 1
fi

echo "== 2. Cai dat Docker (neu chua co) =="
if ! command -v docker >/dev/null 2>&1; then
  apt-get update -y
  apt-get install -y git curl ca-certificates unzip openssl
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
else
  echo "Docker da co san: $(docker --version)"
fi

echo "== 3. Swap 2GB (may 2GB RAM khong co swap la bi OOM-kill) =="
if ! swapon --show | grep -q .; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "Da bat swap 2GB"
else
  swapon --show
fi

echo "== 4. Lay code ve $APP_DIR =="
mkdir -p "$APP_DIR"
if [ -f "$COMPOSE" ] && [ -f "$APP_DIR/backend/pom.xml" ] && [ -f "$APP_DIR/frontend/package.json" ]; then
  echo "Du code trong $APP_DIR (deploy + backend + frontend), khong clone"
elif [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" fetch origin "$GIT_BRANCH"
  git -C "$APP_DIR" checkout -B "$GIT_BRANCH" "origin/$GIT_BRANCH"
else
  # Repo private: can deploy key (SSH) hoac token. Neu khong co, hay day thu cong:
  #   scp -r deploy backend frontend root@server:/opt/budglee/
  git clone --branch "$GIT_BRANCH" https://github.com/CJustin23/ITTTRK304-K24.git "$APP_DIR"
fi
test -f "$COMPOSE" || { echo "Thieu $COMPOSE - chay: scp -r deploy root@server:/opt/budglee/"; exit 1; }
test -f "$APP_DIR/backend/pom.xml" || { echo "Thieu source backend de build image - phai clone ca repo, khong chi deploy/"; exit 1; }

echo "== 5. Sinh biến môi trường và khoá (chi lan dau, luu root-only) =="
if [ ! -f "$ENV_FILE" ]; then
  JWT=$(openssl rand -base64 48 | tr -d '\n')
  DBPASS=$(openssl rand -base64 18 | tr -d '/+=' | cut -c1-16)
  ROOTPASS=$(openssl rand -base64 18 | tr -d '/+=' | cut -c1-16)
  # Cho phep dat san mat khau demo co dinh:  APP_SECURITY_SYSTEM_ADMIN_PASSWORD=... bash deploy/bootstrap.sh
  ADMIN_EMAIL=${APP_SECURITY_SYSTEM_ADMIN_EMAIL:-admin@budglee.local}
  ADMINPASS=${APP_SECURITY_SYSTEM_ADMIN_PASSWORD:-}
  if [ -z "$ADMINPASS" ]; then
    ADMINPASS=$(openssl rand -base64 12 | tr -d '/+=' | cut -c1-12)
    echo "Khong truyen APP_SECURITY_SYSTEM_ADMIN_PASSWORD -> sinh ngau nhien."
  fi
  cat > "$ENV_FILE" <<EOF
DB_NAME=budglee_db
DB_USER=budglee_user
DB_PASSWORD=${DBPASS}
DB_ROOT_PASSWORD=${ROOTPASS}
JWT_SECRET=${JWT}
JWT_EXPIRATION_MS=86400000
APP_SECURITY_SYSTEM_ADMIN_EMAIL=${ADMIN_EMAIL}
APP_SECURITY_SYSTEM_ADMIN_PASSWORD=${ADMINPASS}
EOF
  chmod 600 "$ENV_FILE"
  {
    echo "# Budglee demo credentials - sinh ngay $(date), KHONG commit file nay"
    echo "SYSTEM_ADMIN : ${ADMIN_EMAIL} / ${ADMINPASS}"
    echo "FAMILY_ADMIN : seed.user@budglee.local / password   (tu migration V6)"
    echo "FAMILY_MEMBER: seed.member@budglee.local / password (tu migration V9)"
    echo "MySQL root   : ${ROOTPASS}"
  } > /root/budglee-demo-credentials.txt
  chmod 600 /root/budglee-demo-credentials.txt
  echo "Da ghi $ENV_FILE va /root/budglee-demo-credentials.txt"
else
  echo "Ton tai $ENV_FILE, giu nguyen"
fi

echo "== 6. Build va khoi dong =="
docker compose -f "$COMPOSE" --env-file "$ENV_FILE" up -d --build

echo "== 7. Cho backend sang =="
CODE=000
for _ in $(seq 1 60); do
  CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost/swagger-ui.html || echo 000)
  [ "$CODE" = "200" ] && break
  sleep 3
done
echo "swagger-ui.html -> HTTP $CODE"

echo "== 8. Ket qua =="
docker compose -f "$COMPOSE" ps
docker logs budglee-backend 2>&1 | grep -E "Migrating schema|Successfully applied|Started BudgleeApplication|quản trị hệ thống" | tail -12 || true
docker stats --no-stream
free -h

# Kiem tra RBAC that: SYSTEM_ADMIN phai goi duoc /api/v1/admin/users
ADMIN_EMAIL=$(grep '^APP_SECURITY_SYSTEM_ADMIN_EMAIL=' "$ENV_FILE" | cut -d= -f2-)
ADMIN_PASS=$(grep '^APP_SECURITY_SYSTEM_ADMIN_PASSWORD=' "$ENV_FILE" | cut -d= -f2-)
ADMIN_TOKEN=$(curl -s -m 20 -X POST http://localhost/api/v1/auth/login -H 'Content-Type: application/json' \
  -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASS}\"}" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
ADMIN_HTTP=$(curl -s -o /dev/null -m 20 -w '%{http_code}' http://localhost/api/v1/admin/users \
  -H "Authorization: Bearer ${ADMIN_TOKEN}")
echo "RBAC smoke test  : login SYSTEM_ADMIN -> ${ADMIN_TOKEN:+OK}, GET /admin/users -> HTTP ${ADMIN_HTTP} (ky vong 200)"

echo
echo "URL demo: http://$(curl -s -m 5 ifconfig.me || hostname -I | awk '{print $1}')/swagger-ui.html"
# Chi in mat khau khi chay tu ban phim: CD log tren GitHub Actions se lo secret neu in o day.
if [ -t 1 ]; then
  echo "Tai khoan demo   : cat /root/budglee-demo-credentials.txt"
  echo "  SYSTEM_ADMIN   : ${ADMIN_EMAIL} / ${ADMIN_PASS}"
  echo "  FAMILY_ADMIN   : seed.user@budglee.local / password"
  echo "  FAMILY_MEMBER  : seed.member@budglee.local / password"
else
  echo "Tai khoan demo nam trong /root/budglee-demo-credentials.txt (khong in ra vi khong phai TTY)"
fi
