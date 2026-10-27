# Thư mục tài liệu — Sprint 1 (nhánh `an`)

Học phần Phát triển Dự án Phần mềm · Nhóm 03 · Budglee Platform · GVHD ThS. Hồ Xuân Hùng

| File | Nội dung | Issue Jira | Người viết |
|---|---|---|---|
| [`SRS.md`](SRS.md) | Đặc tả yêu cầu phần mềm: 23 use case, 12 quy tắc nghiệp vụ (BR), 10 yêu cầu phi chức năng (NFR), mô hình 6 bảng, hợp đồng API, tiêu chí nghiệm thu (AC), nợ kỹ thuật | DUAN-28 | Nguyễn Trường An |
| [`JWT-AUTHENTICATION-DESIGN.md`](JWT-AUTHENTICATION-DESIGN.md) | Nghiên cứu Spring Security và thiết kế luồng xác thực JWT: thành phần, trình tự đăng nhập / gọi API được bảo vệ, quyết định thiết kế, lộ trình tăng cứng 7 mục | DUAN-29 | Nguyễn Trường An |
| [`diagrams/01-use-case.svg`](diagrams/01-use-case.svg) · [`.png`](diagrams/01-use-case.png) | Sơ đồ use case theo 6 nhóm chức năng, có chú giải cái nào đã code / chưa | DUAN-28 | An |
| [`diagrams/02-erd.svg`](diagrams/02-erd.svg) · [`.png`](diagrams/02-erd.png) | Sơ đồ quan hệ 6 bảng, đúng theo `V1__init_schema.sql` | DUAN-28 (đối chiếu DUAN-32 của bạn Tú) | An |
| [`diagrams/03-jwt-sequence.svg`](diagrams/03-jwt-sequence.svg) · [`.png`](diagrams/03-jwt-sequence.png) | Trình tự xác thực: đăng nhập → cấp token → request có bảo vệ → lộ trình refresh/rotation | DUAN-29 | An |

## Cách kiểm tra nhanh
- Sơ đồ là SVG nên mở bằng trình duyệt được ngay, không cần phần mềm; PNG kèm theo để chèn vào báo cáo Word.
- Mỗi sơ đồ có file `*.render.html` — đó là trang trung gian dùng để xuất PNG bằng
  `chrome --headless --screenshot=... --window-size=... file:///<tên>.render.html`, giữ lại để tái tạo ảnh khi sơ đồ đổi.

## Nguyên tắc viết tài liệu trong nhóm
1. Tài liệu phải khớp mã. Sau khi đổi `controller`, `entity` hoặc `V1__init_schema.sql`, cập nhật SRS/sơ đồ trong cùng Pull Request.
2. Cái chưa làm thì ghi rõ là chưa làm (xem SRS mục 3 cột "Hiện trạng" và mục 11 "Nợ kỹ thuật"), không viết chung chung cho đủ.
3. Số liệu dẫn chứng phải chỉ được vào file cụ thể trong repo.
