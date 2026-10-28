<!--
  Quy trình Git Flow của nhóm Budglee (DUAN-34):
  - Không push trực tiếp vào main.
  - Nhánh cá nhân: an / thanh / tu / vinh  ->  PR sang develop.
  - develop -> main chỉ thực hiện khi kết thúc sprint, cần 1 review.
-->

## linked issue

`[Sprint n - <tên>] ...` — ghi rõ **DUAN-xx** để GitHub liên kết về Jira board.

## nguồn → đích

| | |
|---|---|
| Nhánh nguồn | `an` / `thanh` / `tu` / `vinh` |
| Nhánh đích | `develop` (kết thúc sprint mới gộp lên `main`) |

## nội dung thay đổi

-

## tự kiểm tra

- [ ] Đã bật hook của nhóm trên máy mình: `git config core.hooksPath .githooks`
- [ ] `./mvnw --batch-mode clean test` xanh (backend)
- [ ] `npm run build` xanh (frontend, nếu sửa frontend)
- [ ] `docker compose config` không báo lỗi (nếu sửa compose/devops)
- [ ] Không commit `.env`, secret, mật khẩu, `node_modules`, `target/`
- [ ] Không xoá/sửa stub `[TODO - NGƯỜI KHÁC]` của thành viên khác
- [ ] Đã gán nhãn `Enhancement`/`Bugfix` và kéo card trên board DUAN sang đúng cột

## bằng chứng chạy được

<!-- Ảnh chụp Swagger / kết quả test / log CI. Bắt buộc với thay đổi có ảnh hưởng đến luồng nghiệp vụ. -->
