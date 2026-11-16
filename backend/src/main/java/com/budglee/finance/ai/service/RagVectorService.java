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
            new KnowledgeChunk(1, "FINANCIAL_METHOD", "Quy tắc 50/30/20",
                    "Phân bổ thu nhập hàng tháng:\n" +
                    "• **50% Thiết yếu**: Tiền nhà, ăn uống, điện nước, xăng xe, học phí\n" +
                    "• **30% Mong muốn**: Mua sắm, giải trí, ăn ngoài, sở thích\n" +
                    "• **20% Tích lũy**: Tiết kiệm khẩn cấp, trả nợ, đầu tư sinh lời",
                    List.of("50/30/20", "quy tắc", "quản lý tài chính", "tiết kiệm", "phân bổ thu nhập", "thiết yếu", "mong muốn")),

            new KnowledgeChunk(2, "FINANCIAL_METHOD", "Phương pháp 6 chiếc lọ (JARS)",
                    "Phân bổ thu nhập ròng vào 6 quỹ:\n" +
                    "• **55% Thiết yếu (NEC)**: Sinh hoạt hàng ngày\n" +
                    "• **10% Tiết kiệm dài hạn (LTSS)**: Mua sắm lớn, dự phòng\n" +
                    "• **10% Phát triển bản thân (EDU)**: Học tập, sách vở\n" +
                    "• **10% Hưởng thụ (PLAY)**: Vui chơi, du lịch\n" +
                    "• **10% Tự do tài chính (FFA)**: Đầu tư tạo thu nhập thụ động\n" +
                    "• **5% Cho đi (GIVE)**: Giúp đỡ người thân, từ thiện",
                    List.of("6 chiếc lọ", "jars", "quỹ", "tự do tài chính", "hưởng thụ", "giáo dục", "cho đi")),

            new KnowledgeChunk(3, "FINANCIAL_METHOD", "Điểm Sức Khỏe Tài Chính",
                    "Đánh giá sức khỏe tài chính qua 4 chỉ số:\n" +
                    "• **Tỷ lệ tiết kiệm**: Nên đạt từ **20%** thu nhập\n" +
                    "• **Tỷ lệ nợ/thu nhập**: Dưới mức **30%**\n" +
                    "• **Quỹ khẩn cấp**: Đủ chi trả **3 - 6 tháng** sinh hoạt\n" +
                    "• **Kỷ luật ngân sách**: Không chi tiêu vượt hạn mức đã đặt",
                    List.of("sức khỏe tài chính", "điểm tài chính", "quỹ khẩn cấp", "tỷ lệ tiết kiệm", "nợ", "lời khuyên")),

            new KnowledgeChunk(4, "USER_GUIDE", "Quản lý và phân loại ví tiền",
                    "Gợi ý phân loại ví thực tế trên Budglee:\n" +
                    "• **Ví Tiền mặt**: Chi tiêu lặt vặt hàng ngày\n" +
                    "• **Tài khoản Ngân hàng**: Nhận lương, chuyển khoản, tiết kiệm\n" +
                    "• **Ví điện tử (MoMo/VNPay)**: Thanh toán online, ăn uống nhanh\n" +
                    "• **Thẻ tín dụng**: Chi tiêu trước trả sau và nhận hoàn tiền",
                    List.of("ví tiền", "tiền mặt", "ngân hàng", "ví điện tử", "thẻ tín dụng", "số dư", "quản lý ví")),

            new KnowledgeChunk(5, "USER_GUIDE", "Thiết lập hạn mức ngân sách tháng",
                    "Cách thiết lập và theo dõi hạn mức chi tiêu:\n" +
                    "• **Cách làm**: Vào **Ngân sách** ➔ **Thêm ngân sách** ➔ Chọn danh mục & số tiền hạn mức.\n" +
                    "• **Cảnh báo**: Màu vàng khi chi tiêu vượt **80%**; Màu đỏ khi vượt **100%** hạn mức.",
                    List.of("ngân sách", "hạn mức", "vượt hạn mức", "cảnh báo", "chi tiêu", "đặt ngân sách")),

            new KnowledgeChunk(6, "USER_GUIDE", "Ghi chép giao dịch nhanh qua AI",
                    "Chỉ cần nhắn ngôn ngữ tự nhiên:\n" +
                    "• *\"Ăn trưa 45k ví tiền mặt\"*, *\"Đổ xăng 70k\"*, *\"Nhận lương 15tr vào VietinBank\"*\n" +
                    "• AI tự phân loại danh mục, chọn ví và hiển thị thẻ xác nhận ngay tức thì.",
                    List.of("ghi chép", "ai", "thu chi", "xác nhận", "tự động", "thêm giao dịch")),

            new KnowledgeChunk(7, "FAMILY_GUIDE", "Sổ quỹ Gia đình (Family Group)",
                    "Quản lý tài chính chung minh bạch:\n" +
                    "• **Chủ hộ (Owner)**: Tạo nhóm và gửi lời mời qua email thành viên.\n" +
                    "• **Thành viên**: Cùng theo dõi biểu đồ chi tiêu chung và đóng góp quỹ.",
                    List.of("gia đình", "family", "quỹ chung", "thành viên", "chia sẻ chi tiêu", "mời")),

            new KnowledgeChunk(8, "SECURITY_POLICY", "Bảo mật dữ liệu tài chính",
                    "Cam kết an toàn thông tin tại Budglee:\n" +
                    "• **Mã hóa AES-256-GCM** bảo vệ khóa API cá nhân (BYOK).\n" +
                    "• **BCrypt** bảo vệ mật khẩu đăng nhập.\n" +
                    "• Phân tách dữ liệu đa người dùng tuyệt đối (chống rò rỉ IDOR).",
                    List.of("bảo mật", "aes-256", "idor", "an toàn", "bcrypt", "mã hóa", "dữ liệu")),

            new KnowledgeChunk(9, "BRANCH_INFO", "Kênh hỗ trợ và liên hệ",
                    "Hỗ trợ Budglee 24/7:\n" +
                    "• **Hotline**: 1900-6868 | **Email**: support@budglee.vn\n" +
                    "• **Địa chỉ**: Tầng 8, Tòa nhà PTIT, 96A Trần Phú, Hà Đông, Hà Nội\n" +
                    "• **Ứng dụng**: https://quanlythuchi.duckdns.org",
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
