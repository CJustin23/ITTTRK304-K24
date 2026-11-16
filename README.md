# Budglee Platform – Nền Tảng Quản Lý Thu Chi Cá Nhân & Gia Đình Thông Minh

<p align="center">
  <img src="https://img.shields.io/badge/Spring%20Boot-3.2.5-brightgreen.svg" alt="Spring Boot" />
  <img src="https://img.shields.io/badge/Java-17%20%7C%2021-orange.svg" alt="Java" />
  <img src="https://img.shields.io/badge/React-18.3.1-blue.svg" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.4-blue.svg" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5.2-purple.svg" alt="Vite" />
  <img src="https://img.shields.io/badge/MySQL-8.0-blue.svg" alt="MySQL" />
  <img src="https://img.shields.io/badge/Redis-7%20Alpine-red.svg" alt="Redis" />
  <img src="https://img.shields.io/badge/Docker%20Compose-Ready-blue.svg" alt="Docker" />
  <img src="https://img.shields.io/badge/Tests-197%20PASS-success.svg" alt="Tests" />
  <img src="https://img.shields.io/badge/Deployment-Live%20VPS-success.svg" alt="Deployment" />
</p>

> **Mã dự án:** `PRJ-FINANCE-BUDGLEE-01`  
> **Lớp học phần:** HN-KS24-CNTT3  
> **Nhóm thực hiện:** Nhóm 03 (Quy mô: 04 thành viên)  
> **Giảng viên hướng dẫn:** ThS. Hồ Xuân Hùng  
> **Kho mã nguồn GitHub:** [https://github.com/CJustin23/ITTTRK304-K24.git](https://github.com/CJustin23/ITTTRK304-K24.git)  
> **Môi trường Triển khai Thực tế (Live Production):** [https://quanlythuchi.duckdns.org](https://quanlythuchi.duckdns.org)  
> **Tài liệu Đặc tả API (Swagger UI Live):** [https://quanlythuchi.duckdns.org/swagger-ui.html](https://quanlythuchi.duckdns.org/swagger-ui.html)  

---

## 1. Tài khoản Thử nghiệm (Demo & Evaluation Accounts)

Nhằm phục vụ quá trình chấm điểm, đánh giá và kiểm thử toàn diện các cấp phân quyền (RBAC) trên hệ thống:

| Vai trò (Role) | Email đăng nhập | Mật khẩu | Phạm vi chức năng kiểm thử |
| :--- | :--- | :--- | :--- |
| **SYSTEM_ADMIN** | `admin@budglee.local` | `BudgleeAdmin@2026!` | Trang Quản trị hệ thống, giám sát tài khoản, quản lý khóa AI, sao lưu & khôi phục database (thử thách 2 bước) |
| **FAMILY_ADMIN** | `seed.user@budglee.local` | `password` | Chủ hộ nhóm "Tổ ấm mẫu", quản lý ví chung, gửi lời mời và phê duyệt thành viên |
| **FAMILY_MEMBER** | `seed.member@budglee.local` | `password` | Thành viên gia đình, ghi chép thu chi vào ví chung & nhận thông báo thời gian thực |
| **INDIVIDUAL_USER** | *(Tự do đăng ký)* | *(Tự chọn)* | Tài khoản cá nhân độc lập (Yêu cầu định dạng email `@gmail.com`) |

---

## 2. Tổng quan Dự án

**Budglee Platform** là nền tảng quản lý tài chính toàn diện dành cho cá nhân và hộ gia đình hiện đại. Hệ thống giải quyết bài toán ghi chép thu chi thủ công rời rạc, hỗ trợ quy chế minh bạch tài chính gia đình, cung cấp Dashboard phân tích dòng tiền tức thời, hệ thống cảnh báo ngân sách đa cấp độ, theo dõi mục tiêu tích lũy dài hạn và tích hợp **Trợ lý AI Cố vấn Tài chính 2 chiều** (Google Gemini AI).

### Các Tính năng Trọng tâm (Core Features):
1. **Quản lý Thu Chi & Cân Bằng Số Dư (ACID Transactions):**
   - Ghi chép Thu (+), Chi (-), Chuyển tiền nội bộ giữa các ví.
   - Số dư ví và lịch sử dòng tiền được tính toán và khóa giao dịch chuẩn ACID.
   - Hỗ trợ đầy đủ sửa & xóa giao dịch với cơ chế tự động hoàn tác (rollback) số dư chính xác.
2. **Không Gian Tài Chính Gia Đình (Family Workspace):**
   - Thiết lập Sổ quỹ chung gia đình, phân quyền Chủ hộ (`FAMILY_ADMIN`) và Thành viên (`FAMILY_MEMBER`).
   - Luồng gửi lời mời tham gia qua Email và đồng bộ thông báo thời gian thực trên Chuông thông báo (Notification Bell).
3. **Trợ Lý AI Cố Vấn Tài Chính (Financial AI Advisor):**
   - Tích hợp trực tiếp Google Gemini API với cơ chế thực thi công cụ thông minh (Function Calling / Tool Execution).
   - Cho phép người dùng hỏi đáp dòng tiền bằng ngôn ngữ tự nhiên: *"Tháng này tôi tiêu nhiều vào cái gì?"*, *"Hãy ghi nhận giúp tôi vừa uống cà phê 45k bằng ví tiền mặt"*.
   - Hỗ trợ mã hóa khóa API cá nhân (BYOK - Bring Your Own Key) chuẩn AES-256.
4. **Hạn Mức Ngân Sách & Cảnh Báo Ngưỡng (Budgets & Overspending Alerts):**
   - Thiết lập hạn mức chi tiêu theo từng danh mục (Ăn uống, Mua sắm, Di chuyển...).
   - Hệ thống tự động tính tỷ lệ tiêu dùng và cảnh báo sớm khi chạm ngưỡng **80%** hoặc **100% (Bội chi)**.
5. **Mục Tiêu Tiết Kiệm (Saving Goals):**
   - Quản lý kế hoạch tài chính dài hạn (Quỹ khẩn cấp, Mua xe, Du lịch...).
   - Hiển thị trực quan thanh tiến độ %, tự động tính số tiền cần tích lũy và hỗ trợ nạp tiền trực tiếp từ ví.
6. **Đa Ví & Thẻ Tín Dụng:**
   - Phân loại ví tiền mặt (`CASH`), tài khoản ngân hàng (`BANK`) và thẻ tín dụng (`CREDIT_CARD`).
   - Cho phép thẻ tín dụng ghi nhận số dư âm an toàn trong hạn mức.
7. **Bảo Mật & Kiểm Soát Tranh Chấp Đồng Thời (Concurrency Safety):**
   - Ứng dụng Khóa Lạc Quan JPA `@Version` (Optimistic Locking) ngăn chặn triệt để lỗi ghi đè dữ liệu (Lost Update) hoặc chi âm ví khi phát sinh giao dịch đồng thời tại cùng mili-giây.
   - Bảo mật mật khẩu người dùng với BCrypt, xác thực JWT Stateless kèm Redis Token Blacklist khi Đăng xuất.
   - Luồng Khôi phục mật khẩu 3 bước qua mã OTP 6 số gửi về Email (Gmail SMTP).
8. **Bảng Điều Khiển Quản Trị Hệ Thống (System Admin Console):**
   - Báo cáo số liệu tổng quan: tổng người dùng, tài khoản khóa, số nhóm hộ, giao dịch 24h.
   - Quản lý khóa tài khoản vi phạm, quản lý khóa AI tập trung.
   - Tính năng Sao lưu (Backup) & Khôi phục (Restore) Database kèm cơ chế xác thực chuỗi Thử thách (Challenge Verification) 2 bước an toàn.

---

## 3. Kiến trúc & Công nghệ (Tech Stack)

| Phân hệ | Công nghệ / Thư viện chính | Vai trò kỹ thuật |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite 5, TypeScript 5, Tailwind CSS | Giao diện Single Page Application (SPA), chuẩn Responsive |
| **UI Components** | Lucide React, Recharts | Biểu đồ trực quan hóa dữ liệu dòng tiền (Daily, Weekly, Monthly) |
| **State Management**| Zustand, Axios Interceptors | Quản lý state toàn cục, tự động gắn JWT Bearer Header |
| **Backend** | Spring Boot 3.2.5, Java 17 / 21 | Kiến trúc RESTful Clean Architecture, Dependency Injection |
| **Bảo mật & Auth** | Spring Security 6, JJWT (io.jsonwebtoken) | Xác thực Stateless JWT, RBAC 4 vai trò, BCrypt password hashing |
| **Database ORM** | Spring Data JPA, Hibernate, HikariCP | Quản lý thực thể, Optimistic Locking (@Version) |
| **Cơ sở dữ liệu** | MySQL 8.0 (InnoDB, UTF-8 mb4) | Lưu trữ quan hệ ACID chuẩn hóa, đánh chỉ mục tối ưu truy vấn |
| **Cache & Session** | Redis 7 (Alpine) | Caching dữ liệu Dashboard Summary/Trends, JWT Blacklist |
| **Migration** | Flyway Migration (V1 -> V15) | Tự động nâng cấp phiên bản cơ sở dữ liệu khi khởi động |
| **Trí tuệ nhân tạo** | Google Gemini API (Gemini 2.5 Flash) | AI Financial Chatbot, Tool Calling (`AiToolExecutorService`) |
| **DevOps & Host** | Docker, Docker Compose, Nginx Reverse Proxy | Triển khai container hóa trọn gói, chứng chỉ SSL Let's Encrypt |
| **CI / CD** | GitHub Actions Pipeline | Kiểm thử tự động (Frontend + Backend + DB Migration) & Auto Deploy VPS |

---

## 4. Cấu trúc Thư mục Dự án

```text
ITTTRK304-K24/
├── .github/
│   ├── workflows/
│   │   └── ci.yml               # Pipeline CI/CD: Test, Build Docker & Auto Deploy VPS
│   └── PULL_REQUEST_TEMPLATE.md # Mẫu Pull Request chuẩn gắn mã nhiệm vụ Jira DUAN-xx
├── backend/                     # Phân hệ Spring Boot Backend (RESTful API)
│   ├── src/main/java/com/budglee/finance/
│   │   ├── ai/                  # Phân hệ AI: GeminiService, AiToolExecutorService, RAG
│   │   ├── config/              # SecurityConfig, RedisConfig, OpenApiConfig, DataLoader
│   │   ├── controller/          # REST Controllers: Auth, Wallet, Transaction, Budget, Family...
│   │   ├── dto/                 # Data Transfer Objects (Requests & Responses)
│   │   ├── entity/              # JPA Entities (User, Wallet, Transaction, Category, Budget, Goal...)
│   │   ├── exception/           # Global Exception Handling (@RestControllerAdvice)
│   │   ├── repository/          # Spring Data JPA Repositories
│   │   ├── security/            # JWT Token Provider, Auth Filter, UserPrincipal
│   │   └── service/             # Nghiệp vụ nghiệp vụ giao dịch (@Transactional)
│   ├── src/main/resources/
│   │   ├── application.yml      # Cấu hình chính
│   │   ├── application-dev.yml  # Profile phát triển Local
│   │   ├── application-prod.properties # Profile chạy Production trên VPS
│   │   └── db/migration/        # 15 tệp bản vá Flyway Database Schema
│   ├── Dockerfile
│   └── pom.xml
├── frontend/                    # Phân hệ Frontend (React 18 + TypeScript + Vite)
│   ├── src/
│   │   ├── components/          # Sidebar, Header, Modals, StatCards, FloatingChatWidget...
│   │   ├── pages/               # AuthPage, Overview, Wallets, Transactions, Budgets, Goals, Family, Admin...
│   │   ├── services/            # Axios API Services (Auth, Wallet, Transaction, AI...)
│   │   ├── store/               # Zustand Global State Management
│   │   ├── types/               # TypeScript Definitions & Enums
│   │   ├── App.tsx              # Component điều hướng chính
│   │   └── main.tsx
│   ├── Dockerfile
│   └── package.json
├── deploy/                      # Cấu hình triển khai Production trên VPS AZVPS (2GB RAM)
│   ├── docker-compose.vps.yml   # Stack Production: Backend, Frontend, MySQL, Redis, Nginx
│   ├── bootstrap.sh             # Kịch bản khởi tạo VPS Ubuntu & cấu hình 2GB Swap OOM-safe
│   ├── ensure-admin.sh          # Tự động đồng bộ tài khoản SYSTEM_ADMIN
│   ├── DEPLOY.md                # Tài liệu hướng dẫn triển khai máy chủ chi tiết
│   └── .env.production.example  # Biến môi trường production mẫu
├── devops/
│   ├── nginx/
│   │   └── nginx.conf           # Cấu hình Reverse Proxy Nginx, SSL DuckDNS & Header chống cache HTML
│   └── scripts/
│       ├── init-db.sql          # Khởi tạo DB & danh mục mặc định
│       └── backup.sh            # Tự động sao lưu Database định kỳ
├── docker-compose.yml           # Khởi chạy toàn bộ hệ sinh thái môi trường Local
├── .env.example                 # Mẫu cấu hình môi trường phát triển
└── README.md                    # Tài liệu đặc tả dự án
```

---

## 5. Bảng Đặc Tả RESTful APIs Cốt Lõi (v1)

Hệ thống cung cấp hệ thống API RESTful đầy đủ, có tài liệu trực quan tại `/swagger-ui.html`:

| Nhóm API | Phương thức | Endpoint URI | Mô tả chức năng | Quyền truy cập |
| :--- | :---: | :--- | :--- | :--- |
| **Xác thực** | `POST` | `/api/v1/auth/register` | Đăng ký tài khoản cá nhân mới | Công khai |
| | `POST` | `/api/v1/auth/register/family-owner` | Đăng ký tài khoản Chủ hộ gia đình | Công khai |
| | `POST` | `/api/v1/auth/login` | Đăng nhập hệ thống, nhận JWT Token | Công khai |
| | `POST` | `/api/v1/auth/logout` | Đăng xuất, vô hiệu hóa JWT qua Redis | User / Admin |
| | `POST` | `/api/v1/auth/forgot-password` | Yêu cầu mã OTP khôi phục mật khẩu | Công khai |
| | `POST` | `/api/v1/auth/reset-password` | Đặt lại mật khẩu mới bằng OTP | Công khai |
| **Ví tiền** | `GET` | `/api/v1/wallets` | Lấy danh sách ví khả dụng của user | Đã đăng nhập |
| | `POST` | `/api/v1/wallets` | Tạo ví mới (CASH, BANK, CREDIT_CARD) | Đã đăng nhập |
| | `PUT` | `/api/v1/wallets/{id}` | Cập nhật thông tin / tên ví | Chủ sở hữu |
| | `DELETE`| `/api/v1/wallets/{id}` | Xóa ví tiền | Chủ sở hữu |
| **Giao dịch** | `GET` | `/api/v1/transactions` | Lấy danh sách giao dịch phân trang | Đã đăng nhập |
| | `POST` | `/api/v1/transactions` | Tạo giao dịch Thu / Chi mới | Đã đăng nhập |
| | `PUT` | `/api/v1/transactions/{id}` | Chỉnh sửa số tiền / thông tin giao dịch | Chủ sở hữu |
| | `DELETE`| `/api/v1/transactions/{id}` | Xóa giao dịch và hoàn tác số dư ví | Chủ sở hữu |
| | `POST` | `/api/v1/transactions/transfer` | Chuyển tiền nội bộ giữa 2 ví | Đã đăng nhập |
| **Ngân sách** | `GET` | `/api/v1/budgets` | Lấy danh sách ngân sách theo tháng/năm | Đã đăng nhập |
| | `POST` | `/api/v1/budgets` | Thiết lập hạn mức ngân sách danh mục | Đã đăng nhập |
| **Tiết kiệm** | `GET` | `/api/v1/saving-goals` | Lấy danh sách mục tiêu tiết kiệm | Đã đăng nhập |
| | `POST` | `/api/v1/saving-goals` | Tạo mục tiêu tiết kiệm mới | Đã đăng nhập |
| | `PUT` | `/api/v1/saving-goals/{id}` | Cập nhật tiến độ / nạp thêm tiền quỹ | Đã đăng nhập |
| | `DELETE`| `/api/v1/saving-goals/{id}` | Xóa mục tiêu tiết kiệm | Đã đăng nhập |
| **Gia đình** | `GET` | `/api/v1/family/members` | Danh sách thành viên cùng nhóm hộ | Thành viên nhóm |
| | `POST` | `/api/v1/family/invitations` | Chủ hộ gửi lời mời thành viên | `FAMILY_ADMIN` |
| | `POST` | `/api/v1/family/invitations/{id}/accept` | Chấp nhận tham gia nhóm gia đình | Người nhận |
| **Dashboard** | `GET` | `/api/v1/dashboard/summary` | Thống kê số dư, thu chi, xu hướng tuần | Đã đăng nhập |
| **AI Advisor**| `POST` | `/api/v1/ai/chat` | Trò chuyện, phân tích tài chính với AI | Đã đăng nhập |
| **Quản trị** | `GET` | `/api/v1/admin/stats` | Thống kê tổng thể toàn hệ thống | `SYSTEM_ADMIN` |
| | `GET` | `/api/v1/admin/users` | Quản lý trạng thái khóa tài khoản | `SYSTEM_ADMIN` |
| | `POST` | `/api/v1/admin/backup` | Tạo bản sao lưu cơ sở dữ liệu tức thời | `SYSTEM_ADMIN` |
| | `POST` | `/api/v1/admin/restore` | Khôi phục database với Challenge Code | `SYSTEM_ADMIN` |

---

## 6. Phân Công Nhân Sự & Nhánh Làm Việc (Git Flow)

Hệ thống phân nhánh phục vụ phối hợp nhóm 4 thành viên theo chuẩn Git Flow:

* **`main`**: Nhánh Release Production, đồng bộ mã nguồn ổn định nhất.
* **`develop`**: Nhánh tích hợp chung Sprint. Mọi Pull Request tính năng sau khi kiểm thử đạt yêu cầu sẽ được gộp vào đây.

### Phân công chi tiết:

| STT | Thành viên | Mã sinh viên | Nhánh Git | Vai trò | Trách nhiệm chính |
| :---: | :--- | :---: | :--- | :--- | :--- |
| 1 | **Nguyễn Trường An** | `B24DTCN181` | `an` | **Backend Lead** | - Kiến trúc bảo mật Spring Security 6, JWT & RBAC đa cấp độ.<br>- Module Xác thực, Đăng ký Gmail & Khôi phục mật khẩu OTP.<br>- Tối ưu hóa API Giao dịch ACID và cơ chế đồng bộ số dư. |
| 2 | **Nguyễn Tiến Thành** | `B24DTCN283` | `thanh` | **Frontend & AI Lead** | - Xây dựng toàn bộ giao diện Budglee SPA (Overview, Wallets, Goals...).<br>- Tích hợp Trợ lý Cố vấn AI 2 chiều (Gemini API & Tool Executor).<br>- Hoàn thiện CRUD Mục tiêu tiết kiệm & đồng bộ Thông báo chuông thời gian thực. |
| 3 | **Bàng Trọng Tú** | `B24DTCN444` | `tu` | **Database & Data Lead** | - Chuẩn hóa thiết kế ERD cơ sở dữ liệu & 15 bản vá Flyway Migration.<br>- Khóa lạc quan `@Version` chống Race Condition & Lost Update.<br>- Cấu hình tầng đệm Redis Cache cho Dashboard Summary & Trends. |
| 4 | **Lê Hoàng Xuân Vinh**| `B24DTCN227` | `vinh` | **DevOps & QA Lead** | - Đóng gói Docker Compose, Nginx Reverse Proxy & SSL trên VPS AZVPS.<br>- Thiết lập đường ống CI/CD GitHub Actions tự động hóa kiểm thử & Deploy.<br>- Viết bộ kiểm thử tự động JUnit 5 (197 tests PASS) & tài liệu Swagger. |

---

## 7. Hướng Dẫn Cài Đặt & Khởi Chạy

### Cách 1: Khởi chạy bằng Docker Compose (Khuyến nghị - 1 lệnh duy nhất)

Yêu cầu máy tính đã cài đặt **Docker Desktop**:

1. Clone mã nguồn:
   ```bash
   git clone https://github.com/CJustin23/ITTTRK304-K24.git
   cd ITTTRK304-K24
   ```
2. Khởi tạo biến môi trường:
   ```bash
   cp .env.example .env
   ```
3. Khởi động toàn bộ cụm dịch vụ (Frontend + Backend + MySQL + Redis):
   ```bash
   docker compose up -d --build
   ```
4. Truy cập hệ thống:
   - **Frontend App:** [http://localhost:3000](http://localhost:3000)
   - **Backend API:** [http://localhost:8080/api/v1](http://localhost:8080/api/v1)
   - **Swagger API Docs:** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
   - **MySQL:** `localhost:3306` (`budglee_user` / `budglee_secret`)
   - **Redis:** `localhost:6379`

---

### Cách 2: Khởi chạy môi trường Phát triển Cục bộ (Local Development)

Yêu cầu máy tính đã cài đặt: **Java 17+**, **Node.js 18+**, **MySQL 8.0**, **Redis 7**.

#### 1. Khởi chạy Backend (Spring Boot):
```bash
cd backend
# Trên Linux / macOS:
./mvnw spring-boot:run
# Trên Windows PowerShell:
.\mvnw.cmd spring-boot:run
```

#### 2. Khởi chạy Frontend (React Vite):
```bash
cd frontend
npm install
npm run dev
```
Mở trình duyệt truy cập: [http://localhost:3000](http://localhost:3000).

---

## 8. Kiểm Thử & Đảm Bảo Chất Lượng (QA & Test Verification)

Hệ thống áp dụng quy trình kiểm thử nghiêm ngặt nhiều tầng:

* **Unit & Integration Tests (Backend):**
  - Chạy toàn bộ 197 ca kiểm thử tự động:
    ```bash
    cd backend
    .\mvnw.cmd test
    ```
  - **Kết quả:** `Tests run: 197, Failures: 0, Errors: 0, Skipped: 0` (100% PASS).
  - Bao gồm: Kiểm thử phân quyền RBAC, kiểm thử tranh chấp số dư đồng thời đa luồng (`WalletOptimisticLockTest`), kiểm thử chống tấn công IDOR, kiểm thử mã hóa khóa API.
* **Frontend Type Checking & Build Test:**
  - Kiểm tra kiểu dữ liệu TypeScript và đóng gói Vite:
    ```bash
    cd frontend
    npm run build
    ```
  - **Kết quả:** `✓ built in ~30s` (Không phát sinh bất kỳ lỗi biên dịch hay cảnh báo kiểu dữ liệu).
* **Kiểm thử E2E Trình duyệt thực tế:**
  - Toàn bộ 9 luồng giao diện người dùng (Đăng nhập, Tổng quan, Quản lý Ví, Giao dịch, Ngân sách, Mục tiêu tiết kiệm, Quỹ gia đình, AI Chatbot, Trang Quản trị) đã được kiểm thử trên trình duyệt Chromium thật, đảm bảo Console sạch hoàn toàn các lỗi đỏ `4xx/5xx`.

---

## 9. Quy Ước Đóng Góp (Git Workflow & Commit Convention)

1. **Cam kết nhánh:** Luôn checkout từ nhánh `develop` sang nhánh cá nhân (`an`, `thanh`, `tu`, `vinh`). Tuyệt đối không commit trực tiếp vào nhánh `main` hoặc `develop`.
2. **Quy chuẩn thông điệp Commit (Conventional Commits):**
   - `feat(...)`: Thêm tính năng mới (ví dụ: `feat(ai): tich hop tro ly co van tai chinh`).
   - `fix(...)`: Sửa lỗi phát sinh (ví dụ: `fix(auth): sua loi xac thuc otp quen mat khau`).
   - `refactor(...)`: Tái cấu trúc mã nguồn mà không đổi logic nghiệp vụ.
   - `test(...)`: Bổ sung hoặc cập nhật ca kiểm thử tự động.
3. **Quy trình Pull Request (PR):**
   - Tạo PR từ nhánh cá nhân vào **`develop`**, gắn mã thẻ Jira `[DUAN-xx]`.
   - Phải vượt qua toàn bộ các bước kiểm thử tự động trên GitHub Actions trước khi được duyệt merge.

---
*Bản quyền tài liệu thuộc về Nhóm 03 – Học viện Công nghệ Bưu chính Viễn thông (PTIT) – 2026.*
