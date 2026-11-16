package com.budglee.finance.ai.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;

/**
 * Lớp bảo vệ đầu vào (Input Guardrail):
 * Ngăn chặn các mẫu tấn công Prompt Injection, Jailbreak, Override System Prompt và rò rỉ dữ liệu.
 */
@Service
@Slf4j
public class InputGuardrailService {

    private static final List<Pattern> INJECTION_PATTERNS = List.of(
            Pattern.compile("(?i)ignore\\s+(all\\s+)?previous\\s+instructions"),
            Pattern.compile("(?i)disregard\\s+(all\\s+)?prior\\s+prompts?"),
            Pattern.compile("(?i)system\\s+prompt\\s+override"),
            Pattern.compile("(?i)you\\s+are\\s+now\\s+(dan|an\\s+ai\\s+without\\s+rules|unrestricted)"),
            Pattern.compile("(?i)reveal\\s+(all\\s+)?(system\\s+instructions|system\\s+prompt|developer\\s+mode)"),
            Pattern.compile("(?i)act\\s+as\\s+(dan|unfiltered|unrestricted|jailbroken)"),
            Pattern.compile("(?i)bỏ\\s+qua\\s+(mọi\\s+)?chỉ\\s+dẫn"),
            Pattern.compile("(?i)tiết\\s+lộ\\s+(system\\s+prompt|chỉ\\s+thị)"),
            Pattern.compile("(?i)(dump|drop)\\s+(table|database|users)")
    );

    /**
     * Kiểm tra xem thông điệp đầu vào có chứa dấu hiệu tấn công ghi đè chỉ thị hay không.
     */
    public boolean isMalicious(String input) {
        if (input == null || input.isBlank()) {
            return false;
        }
        for (Pattern pattern : INJECTION_PATTERNS) {
            if (pattern.matcher(input).find()) {
                log.warn("InputGuardrail: Phát hiện mẫu tấn công Prompt Injection: '{}'", pattern.pattern());
                return true;
            }
        }
        return false;
    }

    /**
     * Trả về thông điệp từ chối lịch sự và điều hướng người dùng quay lại phạm vi của hệ sinh thái Budglee.
     */
    public String getSafeRejectionResponse() {
        return "Xin lỗi bạn, tôi là Trợ lý Cố vấn Tài chính Thông minh của Budglee. " +
               "Tôi được lập trình nghiêm ngặt chỉ hỗ trợ các câu hỏi liên quan đến quản lý chi tiêu, " +
               "theo dõi số dư ví, báo cáo ngân sách, chính sách dịch vụ và hướng dẫn sử dụng của hệ thống Budglee. " +
               "Tôi không thể thực thi các lệnh yêu cầu ghi đè hay can thiệp hệ thống. " +
               "Tôi có thể giúp gì cho tài chính hoặc trải nghiệm sử dụng ứng dụng của bạn hôm nay?";
    }

    /**
     * Làm sạch đầu vào bằng cách bọc dữ liệu trong thẻ an toàn <user_message>
     * để LLM không nhầm lẫn giữa chỉ thị hệ thống và nội dung người dùng.
     */
    public String wrapInSafeTag(String rawMessage) {
        if (rawMessage == null) return "<user_message></user_message>";
        // Loại bỏ các thẻ giả mạo nếu người dùng tự chèn thẻ đóng
        String cleaned = rawMessage.replace("</user_message>", "").replace("<user_message>", "");
        return "<user_message>\n" + cleaned.trim() + "\n</user_message>";
    }
}

