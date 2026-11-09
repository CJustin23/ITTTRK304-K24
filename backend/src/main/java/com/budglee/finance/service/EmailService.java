package com.budglee.finance.service;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

/**
 * =========================================================================
 * SERVICE: GỬI EMAIL THÔNG BÁO & MÃ XÁC THỰC (EMAIL NOTIFICATION SERVICE)
 * =========================================================================
 */
@Service
@Slf4j
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    /**
     * Gửi email mã OTP 6 chữ số đến hộp thư Gmail của người dùng.
     */
    public void sendPasswordResetOtp(String toEmail, String otp) {
        log.info("Chuẩn bị gửi email mã xác thực đến: {}", toEmail);

        if (mailSender == null || fromEmail == null || fromEmail.trim().isEmpty()) {
            log.warn("[EMAIL CONFIG] Chưa cấu hình MAIL_USERNAME/MAIL_PASSWORD trên server. Không thể gửi SMTP thực. OTP={}", otp);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name());

            helper.setFrom(fromEmail, "Budglee Finance Platform");
            helper.setTo(toEmail);
            helper.setSubject("[Budglee] Mã xác thực khôi phục mật khẩu: " + otp);

            String htmlContent = buildOtpHtmlContent(otp);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Đã gửi thành công email mã OTP đến: {}", toEmail);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email đến {}: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("Không thể gửi email xác thực đến " + toEmail + ". Lỗi: " + e.getMessage(), e);
        }
    }

    private String buildOtpHtmlContent(String otp) {
        return "<!DOCTYPE html>"
                + "<html>"
                + "<head><meta charset='UTF-8'></head>"
                + "<body style='margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif;color:#f8fafc;'>"
                + "<div style='max-width:560px;margin:30px auto;background:#1e293b;border-radius:16px;border:1px solid #334155;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.5);'>"
                + "  <div style='background:linear-gradient(135deg,#059669,#0d9488);padding:28px;text-align:center;'>"
                + "    <h1 style='margin:0;font-size:24px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;'>Budglee Finance</h1>"
                + "    <p style='margin:6px 0 0 0;font-size:13px;color:#d1fae5;'>Nền tảng Quản lý Tài chính Thông minh & Gia đình</p>"
                + "  </div>"
                + "  <div style='padding:32px 28px;'>"
                + "    <h2 style='margin:0 0 16px 0;font-size:18px;color:#ffffff;'>Yêu cầu khôi phục mật khẩu</h2>"
                + "    <p style='margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#94a3b8;'>"
                + "      Bạn vừa gửi yêu cầu đặt lại mật khẩu cho tài khoản Budglee. Dưới đây là mã xác thực 6 chữ số của bạn:"
                + "    </p>"
                + "    <div style='text-align:center;margin:28px 0;'>"
                + "      <div style='display:inline-block;background:#0f172a;border:2px dashed #10b981;border-radius:12px;padding:16px 36px;'>"
                + "        <span style='font-family:monospace;font-size:36px;font-weight:900;letter-spacing:10px;color:#34d399;display:block;'>"
                + otp
                + "        </span>"
                + "      </div>"
                + "      <p style='margin:10px 0 0 0;font-size:12px;color:#64748b;'>Mã xác thực có hiệu lực trong <strong>10 phút</strong></p>"
                + "    </div>"
                + "    <p style='margin:0 0 16px 0;font-size:13px;line-height:1.6;color:#94a3b8;'>"
                + "      Nếu bạn <strong>không</strong> yêu cầu đổi mật khẩu, vui lòng bỏ qua email này hoặc kiểm tra lại bảo mật tài khoản."
                + "    </p>"
                + "  </div>"
                + "  <div style='background:#0f172a;padding:18px 28px;border-top:1px solid #334155;text-align:center;font-size:12px;color:#64748b;'>"
                + "    © 2026 Budglee Finance Platform. All rights reserved."
                + "  </div>"
                + "</div>"
                + "</body>"
                + "</html>";
    }
}

