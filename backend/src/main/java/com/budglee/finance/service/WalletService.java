package com.budglee.finance.service;

import com.budglee.finance.dto.WalletRequest;
import com.budglee.finance.entity.User;
import com.budglee.finance.entity.Wallet;
import com.budglee.finance.repository.UserRepository;
import com.budglee.finance.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.regex.Pattern;

/**
 * =========================================================================
 * SERVICE: QUẢN LÝ VÍ VÀ THẺ (DUAN-48)
 * Phụ trách: Nguyễn Trường An (Backend Lead) — nhánh 'an'
 *
 * Quy tắc:
 * 1. Ví luôn thuộc về người đang gọi; không cho nhận id từ body để tránh
 *    repository.save(...) biến request tạo mới thành cập nhật ví của người khác.
 * 2. Mã tiền tệ mặc định VND, số dư khởi tạo mặc định 0.
 * 3. Chỉ lưu số thẻ đã che: chuỗi có 10 chữ số liên tiếp bị từ chối.
 * =========================================================================
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WalletService {

    private static final Pattern TOO_MANY_CONSECUTIVE_DIGITS = Pattern.compile("\\d{10,}");

    private final WalletRepository walletRepository;
    private final UserRepository userRepository;

    @Transactional
    public Wallet create(Long userId, WalletRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tài khoản không còn tồn tại"));

        String masked = trimToNull(request.getCardNumberMasked());
        if (masked != null && TOO_MANY_CONSECUTIVE_DIGITS.matcher(masked).find()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Chỉ được lưu số thẻ đã che, không lưu số thẻ đầy đủ");
        }

        Wallet wallet = Wallet.builder()
                .user(user)
                .walletName(request.getWalletName().trim())
                .type(request.getType())
                .currency(request.getCurrency() == null || request.getCurrency().isBlank() ? "VND" : request.getCurrency().trim())
                .balance(request.getBalance() == null ? BigDecimal.ZERO : request.getBalance())
                .cardNumberMasked(masked)
                .familyGroupId(user.getFamilyGroupId())
                .build();

        Wallet saved = walletRepository.save(wallet);
        log.info("Tạo ví id={} user={} loại={} số dư khởi tạo={}",
                saved.getId(), userId, saved.getType(), saved.getBalance());
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Wallet> list(Long userId) {
        return walletRepository.findByUserId(userId);
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
