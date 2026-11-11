package com.budglee.finance.controller;

import com.budglee.finance.dto.*;
import com.budglee.finance.service.ChatbotKeyService;
import com.budglee.finance.service.AdminBackupService;
import com.budglee.finance.security.UserPrincipal;
import com.budglee.finance.service.UserAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SYSTEM_ADMIN')")
public class AdminOperationsController {
    private final UserAdminService userAdminService;
    private final ChatbotKeyService chatbotKeyService;
    private final AdminBackupService backupService;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminStatsResponse>> stats() {
        return ResponseEntity.ok(ApiResponse.ok(userAdminService.getStats(), "Lấy thống kê hệ thống thành công"));
    }

    @GetMapping("/chatbot-keys")
    public ResponseEntity<ApiResponse<List<ChatbotKeyResponse>>> listKeys() {
        return ResponseEntity.ok(ApiResponse.ok(chatbotKeyService.list(), "Lấy danh sách API key thành công"));
    }

    @PostMapping("/chatbot-keys")
    public ResponseEntity<ApiResponse<ChatbotKeyResponse>> createKey(@Valid @RequestBody ChatbotKeyRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(chatbotKeyService.create(request), "Thêm API key thành công"));
    }

    @PutMapping("/chatbot-keys/{id}")
    public ResponseEntity<ApiResponse<ChatbotKeyResponse>> updateKey(@PathVariable long id,
                                                                      @Valid @RequestBody ChatbotKeyRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(chatbotKeyService.update(id, request), "Cập nhật API key thành công"));
    }

    @PutMapping("/chatbot-keys/{id}/status")
    public ResponseEntity<ApiResponse<ChatbotKeyResponse>> toggleKey(@PathVariable long id,
                                                                      @RequestBody Map<String, Boolean> request) {
        Boolean active = request.get("active");
        if (active == null) throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.BAD_REQUEST, "Thiếu trạng thái active");
        return ResponseEntity.ok(ApiResponse.ok(chatbotKeyService.toggle(id, active), "Cập nhật trạng thái API key thành công"));
    }

    @GetMapping("/chatbot-keys/{id}/reveal")
    public ResponseEntity<ApiResponse<String>> revealKey(@AuthenticationPrincipal UserPrincipal actor, @PathVariable long id) {
        return ResponseEntity.ok(ApiResponse.ok(chatbotKeyService.reveal(id, actor.getId()), "Đã giải mã API key"));
    }

    @DeleteMapping("/chatbot-keys/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteKey(@PathVariable long id) {
        chatbotKeyService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Đã xóa API key"));
    }

    @GetMapping("/backups")
    public ResponseEntity<ApiResponse<List<AdminBackupService.BackupFile>>> listBackups() {
        return ResponseEntity.ok(ApiResponse.ok(backupService.list(), "Lấy danh sách backup thành công"));
    }

    @PostMapping("/backups")
    public ResponseEntity<ApiResponse<AdminBackupService.BackupFile>> createBackup() {
        return ResponseEntity.ok(ApiResponse.ok(backupService.create(), "Tạo backup thành công"));
    }

    @PostMapping("/backups/{name}/restore/prepare")
    public ResponseEntity<ApiResponse<AdminBackupService.RestoreChallenge>> prepareRestore(@PathVariable String name) {
        return ResponseEntity.ok(ApiResponse.ok(backupService.prepareRestore(name), "Xác nhận restore trong bước tiếp theo"));
    }

    @PostMapping("/backups/{name}/restore")
    public ResponseEntity<ApiResponse<Void>> restore(@PathVariable String name,
                                                     @Valid @RequestBody RestoreRequest request) {
        backupService.restore(name, request.getToken(), request.getConfirmation());
        return ResponseEntity.ok(ApiResponse.ok(null, "Khôi phục backup thành công"));
    }
}
