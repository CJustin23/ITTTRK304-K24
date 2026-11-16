package com.budglee.finance.ai.controller;

import com.budglee.finance.ai.dto.*;
import com.budglee.finance.ai.service.AiChatService;
import com.budglee.finance.ai.service.AiKeySecurityService;
import com.budglee.finance.ai.service.AiToolExecutorService;
import com.budglee.finance.dto.ApiResponse;
import com.budglee.finance.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

/**
 * Controller cung cấp REST & Server-Sent Events (SSE) API cho AI Chatbot Widget:
 * - Hỗ trợ cả người dùng đăng nhập (JWT) và khách vãng lai (Session ID).
 * - Streaming phản hồi theo từng token (SSE).
 * - Cơ chế xác nhận Human-in-the-loop trước khi thay đổi dữ liệu ví/đơn hàng.
 * - Quản lý khóa cá nhân (BYOK) mã hóa AES-256-GCM.
 */
@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "AI Chatbot & RAG Controller", description = "Các API phục vụ Trợ lý Cố vấn Tài chính AI và RAG Knowledge")
public class AiChatController {

    private final AiChatService aiChatService;
    private final AiKeySecurityService keySecurityService;
    private final AiToolExecutorService toolExecutor;

    @Operation(summary = "Streaming SSE trò chuyện với AI (Server-Sent Events)")
    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamChat(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AiChatRequest request
    ) {
        Long userId = principal != null ? principal.getId() : null;
        log.info("AI Stream Chat: user={} session='{}'", userId != null ? userId : "guest", request.getSessionId());
        return aiChatService.streamChat(userId, request);
    }

    @Operation(summary = "Trò chuyện với AI (Non-streaming JSON)")
    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<AiChatResponse>> chat(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AiChatRequest request
    ) {
        Long userId = principal != null ? principal.getId() : null;
        AiChatResponse response = aiChatService.processChat(userId, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Xử lý câu hỏi thành công"));
    }

    @Operation(summary = "Xác nhận thực thi hành động Tool (Human-in-the-loop)")
    @PostMapping("/tools/confirm")
    public ResponseEntity<ApiResponse<Map<String, Object>>> confirmToolAction(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, String> body
    ) {
        String confirmationId = body.get("confirmationId");
        if (confirmationId == null || confirmationId.isBlank()) {
            throw new IllegalArgumentException("Mã xác nhận (confirmationId) không được để trống");
        }
        Long userId = principal != null ? principal.getId() : null;
        if (userId == null) {
            throw new IllegalStateException("Cần đăng nhập tài khoản để xác nhận thực thi thao tác tài chính.");
        }
        Map<String, Object> result = toolExecutor.executeConfirmedAction(userId, confirmationId);
        return ResponseEntity.ok(ApiResponse.ok(result, (String) result.get("message")));
    }

    @Operation(summary = "Lấy lịch sử tin nhắn của cuộc trò chuyện (Sliding Window Memory)")
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<AiChatService.MessageRecord>>> getHistory(
            @RequestParam String conversationId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(aiChatService.getHistory(conversationId), "Lấy lịch sử hội thoại thành công"));
    }

    @Operation(summary = "Lưu API Key cá nhân người dùng (BYOK) - Mã hóa AES-256-GCM")
    @PostMapping("/keys")
    public ResponseEntity<ApiResponse<AiKeyStatusResponse>> saveApiKey(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AiKeySaveRequest request
    ) {
        Long userId = principal != null ? principal.getId() : null;
        AiKeyStatusResponse res = keySecurityService.saveKey(userId, request);
        return ResponseEntity.ok(ApiResponse.ok(res, "Đã lưu và mã hóa an toàn API Key thành công"));
    }

    @Operation(summary = "Kiểm tra trạng thái cấu hình API Key cá nhân")
    @GetMapping("/keys/status")
    public ResponseEntity<ApiResponse<AiKeyStatusResponse>> getKeyStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String sessionId
    ) {
        Long userId = principal != null ? principal.getId() : null;
        return ResponseEntity.ok(ApiResponse.ok(keySecurityService.getKeyStatus(userId, sessionId), "Kiểm tra trạng thái API Key thành công"));
    }

    @Operation(summary = "Xóa API Key cá nhân đã cấu hình")
    @DeleteMapping("/keys")
    public ResponseEntity<ApiResponse<Void>> deleteApiKey(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String sessionId
    ) {
        Long userId = principal != null ? principal.getId() : null;
        keySecurityService.deleteKey(userId, sessionId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Đã xóa API Key cá nhân"));
    }
}

