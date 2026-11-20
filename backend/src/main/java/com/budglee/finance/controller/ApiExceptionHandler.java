package com.budglee.finance.controller;

import com.budglee.finance.dto.ApiResponse;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.stream.Collectors;

/**
 * Mọi lỗi phải trả về cùng envelop {success, message, data} như response thành công,
 * vì frontend đọc response.data.data cho tất cả request.
 *
 * Cách mặc định của Spring gọi response.sendError(...), vốn phụ thuộc error-dispatch của servlet
 * container: shape đổi theo, và mã lỗi có thể bị đổi luôn khi bộ lọc xác thực nhảy vào giữa.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    /**
     * Số dư ví có khoa phiên bản (V12). Hai request cùng ghi trên một ví thì bên đến sau bị
     * Hibernate từ chối lúc commit; nếu không có handler này Spring trả 500 trắng và frontend
     * không biết là phải thử lại.
     */
    @ExceptionHandler(OptimisticLockingFailureException.class)
    public ResponseEntity<ApiResponse<Void>> handleOptimisticLock(OptimisticLockingFailureException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.<Void>builder()
                .success(false)
                .message("Số dư vừa thay đổi vì một giao dịch khác chạy song song, vui lòng thử lại")
                .build());
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiResponse<Void>> handleResponseStatus(ResponseStatusException exception) {
        String message = exception.getReason() == null ? "Yêu cầu không hợp lệ" : exception.getReason();
        return ResponseEntity.status(exception.getStatusCode())
                .body(ApiResponse.<Void>builder().success(false).message(message).build());
    }

    /**
     * Body sai cú pháp khiến Jackson bắn HttpMessageNotReadableException ngay lúc đọc DTO, chưa kịp
     * chạy @Valid. Mặc định Spring trả {timestamp, status, error, trace, path}: không có
     * {success, message, data} như frontend đang đọc, lại còn lộ stack trace ra ngoài.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnreadableBody(HttpMessageNotReadableException exception) {
        return ResponseEntity.badRequest().body(ApiResponse.<Void>builder()
                .success(false)
                .message("Dữ liệu gửi lên không phải JSON hợp lệ")
                .build());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .filter(text -> text != null && !text.isBlank())
                .collect(Collectors.joining("; "));
        if (message.isBlank()) {
            message = "Dữ liệu đầu vào không hợp lệ";
        }
        return ResponseEntity.badRequest().body(ApiResponse.<Void>builder().success(false).message(message).build());
    }
}
