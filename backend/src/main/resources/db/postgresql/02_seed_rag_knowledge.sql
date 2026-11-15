-- ==============================================================================
-- Budglee AI Financial Assistant: Seed Data for RAG Knowledge Base
-- Chuyên đề: Quản lý Thu Chi & Tài chính Cá nhân Thông minh
-- ==============================================================================

-- Xóa dữ liệu cũ nếu chạy lại seed
DELETE FROM document_embeddings;
DELETE FROM knowledge_documents;

-- 1. Thêm tài liệu hướng dẫn và chính sách tài chính Budglee
INSERT INTO knowledge_documents (id, title, category, source_url) VALUES 
(1, 'Phương pháp quản lý tài chính cá nhân thông minh: Quy tắc 50/30/20 và 6 chiếc lọ', 'FINANCIAL_METHOD', 'https://quanlythuchi.duckdns.org/guide/budgeting-rules'),
(2, 'Hướng dẫn sử dụng ví tiền, hạn mức ngân sách và ghi chép chi tiêu Budglee', 'USER_GUIDE', 'https://quanlythuchi.duckdns.org/guide/wallets-and-budgets'),
(3, 'Hướng dẫn sử dụng Sổ quỹ Gia đình (Family Group) và chia sẻ chi tiêu', 'FAMILY_GUIDE', 'https://quanlythuchi.duckdns.org/guide/family-finance'),
(4, 'Chính sách bảo mật dữ liệu tài chính và tiêu chuẩn mã hóa Budglee', 'SECURITY_POLICY', 'https://quanlythuchi.duckdns.org/policy/security');

-- 2. Thêm các đoạn văn bản (chunks) chi tiết cho RAG Ingestion Pipeline

-- CHUNKS CHO TÀI LIỆU 1: PHƯƠNG PHÁP QUẢN LÝ TÀI CHÍNH
INSERT INTO document_embeddings (document_id, chunk_index, chunk_content, metadata) VALUES
(1, 1, 
'Quy tắc quản lý tài chính 50/30/20: Đây là phương pháp phân bổ thu nhập hàng tháng đơn giản và hiệu quả nhất: 50% thu nhập dành cho Nhu cầu thiết yếu (tiền nhà, ăn uống cơ bản, điện nước, xăng xe, học phí); 30% dành cho Mong muốn cá nhân (mua sắm, giải trí, du lịch, ăn ngoài, sở thích); 20% dành cho Tích lũy và Đầu tư (tiết kiệm khẩn cấp, trả nợ nhanh, quỹ hưu trí, đầu tư sinh lời).',
'{"category": "FINANCIAL_METHOD", "topic": "quy_tac_50_30_20", "keywords": ["50/30/20", "quy tắc", "quản lý tài chính", "tiết kiệm", "phân bổ thu nhập", "thiết yếu"]}'::jsonb),

(1, 2, 
'Phương pháp 6 chiếc lọ (JARS): Chia thu nhập ròng thành 6 quỹ: 1. Quỹ Nhu cầu thiết yếu NEC (55%), 2. Quỹ Tiết kiệm dài hạn LTSS (10%), 3. Quỹ Giáo dục phát triển bản thân EDU (10%), 4. Quỹ Hưởng thụ PLAY (10%), 5. Quỹ Tự do tài chính FFA (10%), 6. Quỹ Cho đi GIVE (5%). Phương pháp này giúp bạn quản lý dòng tiền toàn diện mà không lo thiếu hụt.',
'{"category": "FINANCIAL_METHOD", "topic": "6_chiec_lo_jars", "keywords": ["6 chiếc lọ", "JARS", "quỹ", "tự do tài chính", "hưởng thụ", "giáo dục"]}'::jsonb),

(1, 3, 
'Cách tính và tối ưu Điểm Sức Khỏe Tài Chính (Financial Health Score): Hệ thống Budglee chấm điểm sức khỏe tài chính dựa trên 4 trụ cột: Tỷ lệ tiết kiệm (nên đạt trên 20%), Tỷ lệ nợ trên thu nhập (dưới 30%), Quỹ dự phòng khẩn cấp (đủ chi trả 3-6 tháng sinh hoạt phí), và Tình trạng tuân thủ ngân sách (không chi vượt hạn mức).',
'{"category": "FINANCIAL_METHOD", "topic": "suc_khoe_tai_chinh", "keywords": ["sức khỏe tài chính", "điểm tài chính", "quỹ khẩn cấp", "tỷ lệ tiết kiệm", "nợ"]}'::jsonb);

-- CHUNKS CHO TÀI LIỆU 2: HƯỚNG DẪN SỬ DỤNG VÍ VÀ NGÂN SÁCH
INSERT INTO document_embeddings (document_id, chunk_index, chunk_content, metadata) VALUES
(2, 1, 
'Hướng dẫn phân loại và quản lý ví tiền: Trên Budglee, bạn nên tạo các ví tiền tương ứng với đời thực: Ví Tiền mặt (cho chi tiêu nhỏ hàng ngày), Tài khoản Ngân hàng (lưu trữ lương và thanh toán chuyển khoản), Ví điện tử MoMo/VNPay/ZaloPay (thanh toán online) và Thẻ tín dụng Credit (ghi nhận công nợ). Việc phân chia ví giúp bạn đối soát tiền chính xác từng đồng.',
'{"category": "USER_GUIDE", "topic": "quan_ly_vi_tien", "keywords": ["ví tiền", "tiền mặt", "ngân hàng", "ví điện tử", "thẻ tín dụng", "số dư"]}'::jsonb),

(2, 2, 
'Cách thiết lập và theo dõi Hạn mức Ngân sách tháng: Vào mục Ngân sách -> chọn Thêm ngân sách -> chọn Danh mục (ví dụ Ăn uống, Mua sắm) và nhập số tiền giới hạn trong tháng. Khi chi tiêu vượt 80% hạn mức, Budglee sẽ hiển thị cảnh báo màu vàng; khi vượt 100%, hệ thống sẽ báo động màu đỏ để bạn điều chỉnh ngay trước khi thâm hụt tài chính.',
'{"category": "USER_GUIDE", "topic": "thiet_lap_ngan_sach", "keywords": ["ngân sách", "hạn mức", "vượt hạn mức", "cảnh báo", "chi tiêu"]}'::jsonb),

(2, 3, 
'Ghi chép giao dịch nhanh cùng Trợ lý AI: Bạn có thể nhắn tin trực tiếp với Budglee AI bằng ngôn ngữ tự nhiên như: "Vừa ăn trưa 45k từ ví tiền mặt", "Đổ xăng 70k", "Nhận lương 15 triệu vào ngân hàng". AI sẽ tự động phân loại danh mục, chọn đúng ví và hiển thị thẻ xác nhận để bạn chỉ cần bấm [Xác nhận] là tiền được cập nhật vào sổ.',
'{"category": "USER_GUIDE", "topic": "ghi_chep_ai", "keywords": ["ghi chép", "AI", "thu chi", "xác nhận", "tự động"]}'::jsonb);

-- CHUNKS CHO TÀI LIỆU 3: SỔ QUỸ GIA ĐÌNH
INSERT INTO document_embeddings (document_id, chunk_index, chunk_content, metadata) VALUES
(3, 1, 
'Tính năng Sổ quỹ Gia đình (Family Group): Cho phép các thành viên trong gia đình hoặc nhóm bạn ở chung cùng ghi chép và theo dõi chi tiêu chung minh bạch. Chủ hộ (Family Owner) có thể tạo nhóm và gửi lời mời qua email. Các thành viên có thể xem biểu đồ thu chi cả nhà và cùng nhau đóng góp vào quỹ chung.',
'{"category": "FAMILY_GUIDE", "topic": "so_quy_gia_dinh", "keywords": ["gia đình", "family", "quỹ chung", "thành viên", "chia sẻ chi tiêu"]}'::jsonb);

-- CHUNKS CHO TÀI LIỆU 4: BẢO MẬT DỮ LIỆU
INSERT INTO document_embeddings (document_id, chunk_index, chunk_content, metadata) VALUES
(4, 1, 
'Cam kết an toàn và bảo mật dữ liệu tài chính: Budglee áp dụng chuẩn mã hóa đối xứng AES-256-GCM để bảo vệ khóa API cá nhân (BYOK) và thông tin tài chính nhạy cảm của người dùng. Mật khẩu được băm an toàn bằng BCrypt. Dữ liệu tài chính của từng người dùng được phân tách và cô lập tuyệt đối (chống lỗ hổng IDOR), cam kết không bao giờ chia sẻ số dư hay lịch sử giao dịch cho bên thứ ba.',
'{"category": "SECURITY_POLICY", "topic": "bao_mat_du_lieu", "keywords": ["bảo mật", "AES-256", "IDOR", "an toàn", "BCrypt", "mã hóa"]}'::jsonb);
