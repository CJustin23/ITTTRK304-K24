# Budglee Platform – Personal & Family Finance Management (MVP)
> **Mã dự án:** `PRJ-FINANCE-BUDGLEE-01`  
> **Lớp học phần:** HN-KS24-CNTT3  
> **Nhóm thực hiện:** Nhóm 03 (Quy mô: 04 thành viên)  
> **Giảng viên hướng dẫn:** ThS. Hồ Xuân Hùng  
> **Kho mã nguồn:** [https://github.com/CJustin23/ITTTRK304-K24.git](https://github.com/CJustin23/ITTTRK304-K24.git)

---

## 1. Tổng quan Dự án
**Budglee Platform** là nền tảng quản lý thu chi tài chính cá nhân và gia đình trực quan, hiện đại. Hệ thống giải quyết bài toán ghi chép tài chính thủ công, cung cấp Dashboard số dư tức thời, quản lý hạn mức ngân sách thông minh (cảnh báo 80% / 100%), thiết lập mục tiêu tích lũy và tích hợp AI Bot phân tích thói quen chi tiêu.

### Các thực thể dữ liệu cốt lõi (6 Entities):
1. `users`: Thông tin người dùng, phân quyền (Cá nhân, Chủ hộ gia đình, Thành viên, Quản trị viên).
2. `wallets`: Quản lý ví tiền mặt, tài khoản ngân hàng và thẻ tín dụng.
3. `categories`: Danh mục thu/chi mặc định và danh mục tùy chỉnh.
4. `transactions`: Giao dịch Thu (+), Chi (-), Chuyển khoản với cơ chế ACID cập nhật số dư tức thời.
5. `budgets`: Thiết lập hạn mức ngân sách định kỳ kèm cảnh báo đa cấp độ.
6. `saving_goals`: Mục tiêu tiết kiệm dài hạn và tiến độ hoàn thành.

---

## 2. Kiến trúc & Công nghệ (Tech Stack)

| Phân hệ | Công nghệ & Thư viện |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Recharts, Zustand, Axios, Lucide Icons |
| **Backend** | Spring Boot 3.2.x (Java 17/21), Spring Security + JWT, Spring Data JPA, Hibernate |
| **Database & Cache** | MySQL 8.0, Redis 7 (Caching Dashboard & JWT blacklist), Flyway Migration |
| **DevOps & Triển khai** | Docker, Docker Compose, Nginx Reverse Proxy, GitHub Actions CI/CD |

---

## 3. Cấu trúc Thư mục Dự án

```text
ITTTRK304-K24/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI pipeline
├── backend/                     # Mã nguồn Spring Boot RESTful API
│   ├── src/main/java/com/budglee/finance/
│   │   ├── config/              # SecurityConfig, RedisConfig, OpenApiConfig
│   │   ├── controller/          # Auth, Wallet, Transaction, Budget, Dashboard
│   │   ├── dto/                 # Request/Response objects
│   │   ├── entity/              # 6 JPA entities (User, Wallet, Transaction...)
│   │   ├── repository/          # Spring Data JPA repositories
│   │   ├── security/            # JWT Token Provider, Auth Filter, UserPrincipal
│   │   └── service/             # Business Logic & Transactions (@Transactional)
│   ├── src/main/resources/
│   │   ├── application.yml      # Base configuration
│   │   ├── application-dev.yml  # Dev profile (MySQL + Redis)
│   │   └── db/migration/        # Flyway SQL migration (V1__init_schema.sql)
│   ├── Dockerfile
│   └── pom.xml
├── frontend/                    # Mã nguồn React + TypeScript (Vite + Tailwind)
│   ├── src/
│   │   ├── components/          # Sidebar, Header, StatCard, ChartSection, Cards...
│   │   ├── services/            # Axios API clients
│   │   ├── store/               # Zustand global store
│   │   ├── types/               # TypeScript interfaces
│   │   ├── App.tsx              # Main Dashboard layout
│   │   └── main.tsx
│   ├── Dockerfile
│   └── package.json
├── devops/
│   ├── nginx/                   # Nginx reverse proxy routing
│   └── scripts/
│       ├── init-db.sql          # SQL schema & default categories seed
│       └── backup.sh            # Auto database backup script (00:00 hàng ngày)
├── docker-compose.yml           # Khởi chạy toàn bộ hệ sinh thái (App + DB + Redis)
├── .env.example                 # Mẫu biến môi trường
└── README.md
```

---

## 4. Phân chia Nhân sự & Nhánh Git (Git Flow)

Hệ thống phân nhánh phục vụ phối hợp nhóm 4 thành viên:

* **`main`**: Nhánh chính (Production release). Chứa mã nguồn ổn định nhất.
* **`develop`**: Nhánh tích hợp chung (Development integration). Mọi tính năng sau khi test xong sẽ merge vào đây.

### Nhánh và nhiệm vụ của từng thành viên:

| STT | Thành viên (MSV) | Nhánh Git | Vai trò | Trách nhiệm chính |
| :---: | :--- | :--- | :--- | :--- |
| 1 | **Nguyễn Trường An**<br>*(B24DTCN181)* | `an`<br>`feat/an-backend-core` | **Backend Lead** | - Hoàn thiện Module Auth (JWT, RBAC cá nhân & gia đình)<br>- Viết API CRUD Transaction (ACID balance update)<br>- Viết API Budgets & Saving Goals |
| 2 | **Nguyễn Tiến Thành**<br>*(B24DTCN283)* | `thanh`<br>`feat/thanh-frontend-ui` | **Frontend & Backend Lead** | - Dựng giao diện Overview Dashboard Budglee Figma<br>- Kết nối API, biểu đồ Recharts (Daily, Weekly, Monthly)<br>- API thống kê và Bot gợi ý tối ưu chi tiêu |
| 3 | **Bàng Trọng Tú**<br>*(B24DTCN444)* | `tu`<br>`feat/tu-database-data` | **Database & Data Lead** | - Chuẩn hóa ERD & quản lý Migration Flyway<br>- Đánh chỉ mục Index tối ưu query báo cáo lịch sử<br>- Cấu hình Redis Cache cho Dashboard API |
| 4 | **Lê Hoàng Xuân Vinh**<br>*(B24DTCN227)* | `vinh`<br>`feat/vinh-devops-qa` | **DevOps & QA Lead** | - Quản trị Docker Compose, Nginx, SSL trên VPS<br>- Duy trì kịch bản tự động sao lưu DB (00:00 hàng ngày)<br>- Viết JUnit tests, Postman collection & CI/CD pipeline |

---

## 5. Hướng dẫn Bắt đầu Nhanh (Dành cho thành viên nhóm)

### Bước 1: Clone kho mã nguồn về máy
```bash
git clone https://github.com/CJustin23/ITTTRK304-K24.git
cd ITTTRK304-K24
```

### Bước 2: Chuyển sang nhánh làm việc của mình
Tùy theo phân công ở Bảng trên, mỗi người checkout sang nhánh của mình:

* **Đối với AN:**
  ```bash
  git checkout an
  ```
* **Đối với THÀNH:**
  ```bash
  git checkout thanh
  ```
* **Đối với TÚ:**
  ```bash
  git checkout tu
  ```
* **Đối với VINH:**
  ```bash
  git checkout vinh
  ```

### Bước 3: Cấu hình biến môi trường
Tạo file `.env` từ file mẫu:
```bash
cp .env.example .env
```

---

## 6. Hướng dẫn Chạy ứng dụng

### Cách 1: Chạy bằng Docker Compose (Khuyến nghị - 1 lệnh duy nhất)
Đảm bảo máy đã cài đặt Docker Desktop:
```bash
docker compose up -d --build
```
* **Frontend:** [http://localhost:3000](http://localhost:3000)
* **Backend API:** [http://localhost:8080/api/v1](http://localhost:8080/api/v1)
* **Swagger API Docs:** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
* **MySQL Database:** `localhost:3306` (user: `budglee_user`, pass: `budglee_secret`, db: `budglee_db`)
* **Redis:** `localhost:6379`

### Cách 2: Chạy cục bộ (Local Development)

#### 1. Chạy Backend (Spring Boot):
Yêu cầu Java 17+ và MySQL/Redis đang chạy:
```bash
cd backend
./mvnw spring-boot:run
# hoặc trên Windows PowerShell:
.\mvnw.cmd spring-boot:run
```

#### 2. Chạy Frontend (React + Vite):
Yêu cầu Node.js 18+:
```bash
cd frontend
npm install
npm run dev
```
Truy cập [http://localhost:3000](http://localhost:3000).

---

## 7. Quy tắc Commit & Merge Code (Git Workflow)

1. **Cam kết nhánh:** Luôn làm việc trên nhánh cá nhân (`an`, `thanh`, `tu`, `vinh`). Tuyệt đối không push trực tiếp lên `main` hoặc `develop`.
2. **Quy chuẩn commit (Conventional Commits):**
   * `feat: thêm chức năng lọc giao dịch theo danh mục`
   * `fix: sửa lỗi tính sai số dư sau khi thêm khoản chi`
   * `docs: cập nhật tài liệu swagger`
   * `refactor: tối ưu câu truy vấn báo cáo tháng`
3. **Tạo Pull Request (PR):**
   * Khi hoàn thành một tính năng, push lên remote và tạo PR vào nhánh **`develop`**.
   * Yêu cầu ít nhất 01 thành viên khác review & approve trước khi merge.
