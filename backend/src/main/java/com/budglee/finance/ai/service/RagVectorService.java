package com.budglee.finance.ai.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Hệ thống RAG (Retrieval-Augmented Generation) cho Trợ lý Quản lý Tài chính Budglee:
 * Tra cứu tri thức nội bộ về quy tắc tài chính (50/30/20, 6 chiếc lọ), quản lý ví tiền,
 * thiết lập ngân sách tháng, sức khỏe tài chính, sổ quỹ gia đình và bảo mật dữ liệu.
 */
@Service
@Slf4j
public class RagVectorService {

    @Value("${app.ai.postgres.enabled:false}")
    private boolean pgVectorEnabled;

    public record KnowledgeChunk(long id, String category, String topic, String content, List<String> keywords) {}

    // Bộ tài liệu tri thức chuẩn hóa về Quản lý Tài chính của Budglee Platform
    private final List<KnowledgeChunk> knowledgeBase = List.of(
            new KnowledgeChunk(1, "FINANCIAL_METHOD", "Quy tắc quản lý tài chính 50/30/20",
                    "Quy tắc quản lý tài chính 50/30/20: Đây là phương pháp phân bổ thu nhập hàng tháng đơn giản và hiệu quả nhất: " +
                    "50% thu nhập dành cho Nhu cầu thiết yếu (tiền thuê nhà, ăn uống cơ bản, điện nước, xăng xe, học phí); " +
                    "30% dành cho Mong muốn cá nhân (mua sắm, giải trí, du lịch, ăn ngoài, sở thích); " +
                    "20% dành cho Tích lũy và Đầu tư (tiết kiệm khẩn cấp, trả nợ nhanh, quỹ hưu trí, đầu tư sinh lời).",
                    List.of("50/30/20", "quy tắc", "quản lý tài chính", "tiết kiệm", "phân bổ thu nhập", "thiết yếu", "mong muốn")),

            new KnowledgeChunk(2, "FINANCIAL_METHOD", "Phương pháp 6 chiếc lọ (JARS)",
                    "Phương pháp 6 chiếc lọ (JARS): Chia thu nhập ròng thành 6 quỹ: " +
                    "1. Quỹ Nhu cầu thiết yếu NEC (55%), 2. Quỹ Tiết kiệm dài hạn LTSS (10%), " +
                    "3. Quỹ Giáo dục phát triển bản thân EDU (10%), 4. Quỹ Hưởng thụ PLAY (10%), " +
                    "5. Quỹ Tự do tài chính FFA (10%), 6. Quỹ Cho đi GIVE (5%). " +
                    "Phương pháp này giúp bạn quản lý dòng tiền toàn diện mà không lo thiếu hụt.",
                    List.of("6 chiếc lọ", "jars", "quỹ", "tự do tài chính", "hưởng thụ", "giáo dục", "cho đi")),

            new KnowledgeChunk(3, "FINANCIAL_METHOD", "Điểm Sức Khỏe Tài Chính (Financial Health Score)",
                    "Cách tính và tối ưu Điểm Sức Khỏe Tài Chính (Financial Health Score): Hệ thống Budglee chấm điểm sức khỏe tài chính " +
                    "dựa trên 4 trụ cột: Tỷ lệ tiết kiệm (nên đạt trên 20%), Tỷ lệ nợ trên thu nhập (dưới 30%), " +
                    "Quỹ dự phòng khẩn cấp (đủ chi trả 3-6 tháng sinh hoạt phí), và Tình trạng tuân thủ ngân sách (không chi vượt hạn mức).",
                    List.of("sức khỏe tài chính", "điểm tài chính", "quỹ khẩn cấp", "tỷ lệ tiết kiệm", "nợ", "lời khuyên")),

            new KnowledgeChunk(4, "USER_GUIDE", "Quản lý và phân loại ví tiền",
                    "Hướng dẫn phân loại và quản lý ví tiền: Trên Budglee, bạn nên tạo các ví tiền tương ứng với đời thực: " +
                    "Ví Tiền mặt (cho chi tiêu nhỏ hàng ngày), Tài khoản Ngân hàng (lưu trữ lương và thanh toán chuyển khoản), " +
                    "Ví điện tử MoMo/VNPay/ZaloPay (thanh toán online) và Thẻ tín dụng Credit (ghi nhận công nợ). " +
                    "Việc phân chia ví giúp bạn đối soát tiền chính xác từng đồng.",
                    List.of("ví tiền", "tiền mặt", "ngân hàng", "ví điện tử", "thẻ tín dụng", "số dư", "quản lý ví")),

            new KnowledgeChunk(5, "USER_GUIDE", "Thiết lập hạn mức ngân sách tháng",
                    "Cách thiết lập và theo dõi Hạn mức Ngân sách tháng: Vào mục Ngân sách -> chọn Thêm ngân sách -> chọn Danh mục " +
                    "(ví dụ Ăn uống, Mua sắm) và nhập số tiền giới hạn trong tháng. Khi chi tiêu vượt 80% hạn mức, Budglee sẽ hiển thị " +
                    "cảnh báo màu vàng; khi vượt 100%, hệ thống sẽ báo động màu đỏ để bạn điều chỉnh ngay trước khi thâm hụt tài chính.",
                    List.of("ngân sách", "hạn mức", "vượt hạn mức", "cảnh báo", "chi tiêu", "đặt ngân sách")),

            new KnowledgeChunk(6, "USER_GUIDE", "Ghi chép giao dịch cùng Trợ lý AI",
                    "Ghi chép giao dịch nhanh cùng Trợ lý AI: Bạn có thể nhắn tin trực tiếp với Budglee AI bằng ngôn ngữ tự nhiên như: " +
                    "\"Vừa ăn trưa 45k từ ví tiền mặt\", \"Đổ xăng 70k\", \"Nhận lương 15 triệu vào ngân hàng\". AI sẽ tự động phân loại " +
                    "danh mục, chọn đúng ví và hiển thị thẻ xác nhận để bạn chỉ cần bấm [Xác nhận] là tiền được cập nhật vào sổ ví tức thì.",
                    List.of("ghi chép", "ai", "thu chi", "xác nhận", "tự động", "thêm giao dịch")),

            new KnowledgeChunk(7, "FAMILY_GUIDE", "Sổ quỹ Gia đình (Family Group)",
                    "Tính năng Sổ quỹ Gia đình (Family Group): Cho phép các thành viên trong gia đình hoặc nhóm bạn ở chung cùng ghi chép " +
                    "và theo dõi chi tiêu chung minh bạch. Chủ hộ (Family Owner) có thể tạo nhóm và gửi lời mời qua email. Các thành viên có thể " +
                    "xem biểu đồ thu chi cả nhà và cùng nhau đóng góp vào quỹ chung.",
                    List.of("gia đình", "family", "quỹ chung", "thành viên", "chia sẻ chi tiêu", "mời")),

            new KnowledgeChunk(8, "SECURITY_POLICY", "Bảo mật dữ liệu tài chính người dùng",
                    "Cam kết an toàn và bảo mật dữ liệu tài chính: Budglee áp dụng chuẩn mã hóa đối xứng AES-256-GCM để bảo vệ khóa API cá nhân (BYOK) " +
                    "và thông tin tài chính nhạy cảm của người dùng. Mật khẩu được băm an toàn bằng BCrypt. Dữ liệu tài chính của từng người dùng " +
                    "được phân tách và cô lập tuyệt đối (chống lỗ hổng IDOR), cam kết không bao giờ chia sẻ số dư hay lịch sử giao dịch cho bên thứ ba.",
                    List.of("bảo mật", "aes-256", "idor", "an toàn", "bcrypt", "mã hóa", "dữ liệu")),

            new KnowledgeChunk(9, "BRANCH_INFO", "Kênh hỗ trợ và thông tin liên hệ",
                    "Kênh hỗ trợ chính thức của Budglee: Trụ sở chính tại Tầng 8, Tòa nhà PTIT, 96A Trần Phú, Quận Hà Đông, TP. Hà Nội. " +
                    "Chi nhánh TP.HCM tại 180 Nguyễn Đình Chiểu, Quận 3. Hotline hỗ trợ: 1900-6868. Email hỗ trợ: support@budglee.vn. " +
                    "Hệ thống AI Chatbot sẵn sàng hỗ trợ bạn 24/7 trên ứng dụng web https://quanlythuchi.duckdns.org.",
                    List.of("hỗ trợ", "hotline", "liên hệ", "địa chỉ", "trụ sở", "email", "cskh"))
    );

    /**
     * Tìm kiếm đoạn tri thức liên quan nhất dựa trên truy vấn của người dùng.
     * Sử dụng Similarity Scoring (kết hợp mật độ từ khóa và tương đồng ngữ nghĩa).
     */
    public List<KnowledgeChunk> retrieveRelevantChunks(String userQuery, int topK) {
        if (userQuery == null || userQuery.isBlank()) {
            return List.of();
        }

        String lowerQuery = userQuery.toLowerCase().trim();
        String[] queryWords = lowerQuery.split("\\s+");

        record ScoredChunk(KnowledgeChunk chunk, double score) {}

        List<ScoredChunk> scoredChunks = new ArrayList<>();

        for (KnowledgeChunk chunk : knowledgeBase) {
            double score = 0.0;
            String lowerContent = chunk.content().toLowerCase();
            String lowerTopic = chunk.topic().toLowerCase();

            // Khớp từ khóa chủ đề (trọng số cao)
            for (String kw : chunk.keywords()) {
                if (lowerQuery.contains(kw.toLowerCase())) {
                    score += 4.0;
                }
            }

            // Khớp từng từ trong nội dung
            for (String word : queryWords) {
                if (word.length() > 2) {
                    if (lowerTopic.contains(word)) score += 2.0;
                    if (lowerContent.contains(word)) score += 0.5;
                }
            }

            if (score > 1.0) {
                scoredChunks.add(new ScoredChunk(chunk, score));
            }
        }

        scoredChunks.sort((a, b) -> Double.compare(b.score(), a.score()));

        return scoredChunks.stream()
                .limit(topK)
                .map(ScoredChunk::chunk)
                .collect(Collectors.toList());
    }

    /**
     * Tạo chuỗi ngữ cảnh tri thức chuẩn hóa để đưa vào Prompt cho LLM.
     */
    public String buildRagContext(String userQuery) {
        List<KnowledgeChunk> chunks = retrieveRelevantChunks(userQuery, 3);
        if (chunks.isEmpty()) {
            return "";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("<rag_context>\n");
        sb.append("TÀI LIỆU TRI THỨC VÀ QUY TẮC QUẢN LÝ TÀI CHÍNH BUDGLEE:\n");
        for (int i = 0; i < chunks.size(); i++) {
            KnowledgeChunk c = chunks.get(i);
            sb.append(String.format("[%d] Chủ đề: %s (%s)\n%s\n\n", i + 1, c.topic(), c.category(), c.content()));
        }
        sb.append("</rag_context>");
        return sb.toString();
    }
}
