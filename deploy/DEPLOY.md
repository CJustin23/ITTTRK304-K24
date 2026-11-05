# Deploy Budglee len VPS (Ubuntu, 2GB RAM)

Chay toan bo lenh duoi day **tren server**, qua SSH (cong 22). Neu VPS dang Windows thi cai lai
Ubuntu trong panel AZVPS truoc — Docker Desktop tren Windows khong chay noi voi 2GB RAM.

## 1. Cau hinh may

```bash
sudo apt update && sudo apt install -y git curl ca-certificates unzip
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER && newgrp docker
```

Swap 2GB (may 2GB RAM ma khong co swap la bi OOM-kill):

```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

## 2. Lay code

```bash
git clone git@github.com:CJustin23/ITTTRK304-K24.git ~/budglee && cd ~/budglee
git checkout develop
```

Repo la private nen tao **deploy key** (Settings → Deploy keys, read-only) va them private key
vao `~/.ssh/` truoc khi clone.

## 3. Điền biến môi trường và khoá JWT

```bash
cp deploy/.env.production.example deploy/.env.production
openssl rand -base64 48          # dan ket qua vao JWT_SECRET
```

Bat buoc phai co `JWT_SECRET`, `DB_PASSWORD`, `DB_ROOT_PASSWORD`.
Muon co tai quan tri de demo RBAC thi dien them `APP_SECURITY_SYSTEM_ADMIN_EMAIL` /
`APP_SECURITY_SYSTEM_ADMIN_PASSWORD` — bo trong thi backend van chay, khong tao ai ca.

## 4. Build va chay

```bash
docker compose -f deploy/docker-compose.vps.yml --env-file deploy/.env.production up -d --build
docker compose -f deploy/docker-compose.vps.yml ps
```

## 5. Kiem tra

```bash
docker logs budglee-backend --tail 40      # phai thay "Migrating schema ... version 9" va "Started BudgleeApplication"
free -h                                     # tong RAM con duoi 2GB, swap da bat
docker stats --no-stream                    # mysql <= 384M, backend <= 768M
curl -s -o /dev/null -w '%{http_code}\n' http://localhost/            # 200 tu frontend
curl -s -o /dev/null -w '%{http_code}\n' http://localhost/swagger-ui.html
curl -s -X POST http://localhost/api/v1/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"seed.user@budglee.local","password":"password"}'       # FAMILY_ADMIN tu seed V6
```

## 6. Lenh khi co su co

```bash
docker compose -f deploy/docker-compose.vps.yml logs -f backend
docker compose -f deploy/docker-compose.vps.yml restart backend
docker compose -f deploy/docker-compose.vps.yml down          # giu lai du lieu
docker volume rm budglee_mysql_data                           # CHU Y: xoa toan bo du lieu
```

## 7. Ghi chu quan trong

- File compose nay **khong publish cong 3306/6379/8080** ra internet; chi mo 80.
- Migration chay tu dong khi backend khoi dong (profile `prod`, `spring.flyway.enabled=true`).
  Neu log bao `Found more than one migration with version X` thi co hai file trung so — doi ten
  file moi hon sang so ke tiep, khong xoa cua nguoi khac.
- Tai khoan demo co mat khau `password` (hash co san trong V6/V9) — chi dung cho dev/demo,
  khong dung tai khoan nay cho du lieu that.
