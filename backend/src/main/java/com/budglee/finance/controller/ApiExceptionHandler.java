package com.budglee.finance.controller;

import com.budglee.finance.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
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

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiResponse<Void>> handleResponseStatus(ResponseStatusException exception) {
        String message = exception.getReason() == null ? "Yêu cầu không hợp lệ" : exception.getReason();
        return ResponseEntity.status(exception.getStatusCode())
                .body(ApiResponse.<Void>builder().success(false).message(message).build());
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
