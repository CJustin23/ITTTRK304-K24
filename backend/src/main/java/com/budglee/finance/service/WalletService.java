package com.budglee.finance.service;

import com.budglee.finance.dto.WalletRequest;
import com.budglee.finance.dto.WalletUpdateRequest;
import com.budglee.finance.entity.User;
import com.budglee.finance.entity.Wallet;
import com.budglee.finance.entity.WalletType;
import com.budglee.finance.repository.TransactionRepository;
import com.budglee.finance.repository.UserRepository;
import com.budglee.finance.repository.WalletRepository;
import com.budglee.finance.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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
 * 4. Danh sách ví nhìn thấy gồm ví của mình và ví chung của hộ gia đình (DUAN-40);
 *    người không cùng hộ không thấy gì.
 * 5. Sửa/xoá chỉ chủ ví làm được; ví của người khác trả 404 chứ không trả 403, vì 403 xác nhận
 *    với kẻ dò là id đó có thật.
 * 6. PUT không nhận số dư, và không cho đổi loại khỏi CREDIT_CARD khi ví đang âm — số dư âm
 *    chỉ hợp lệ với thẻ tín dụng.
 * 7. Xoá ví đã có giao dịch thì bị chặn: lược đồ khai ON DELETE CASCADE, tức là xoá ví sẽ xoá
 *    luôn lịch sử sử dụng của người dùng.
 * =========================================================================
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WalletService {

    private static final Pattern TOO_MANY_CONSECUTIVE_DIGITS = Pattern.compile("\\d{10,}");

    private final WalletRepository walletRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;

    @CacheEvict(value = {"dashboardSummary", "dashboardTrends"}, allEntries = true)
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
        String familyGroupId = userRepository.findById(userId)
                .map(User::getFamilyGroupId)
                .orElse(null);
        if (familyGroupId == null || familyGroupId.isBlank()) {
            return walletRepository.findByUserId(userId);
        }

        Map<Long, Wallet> visible = new LinkedHashMap<>();
        walletRepository.findByUserId(userId).forEach(wallet -> visible.put(wallet.getId(), wallet));
        walletRepository.findByFamilyGroupId(familyGroupId)
                .forEach(wallet -> visible.putIfAbsent(wallet.getId(), wallet));
        return new ArrayList<>(visible.values());
    }

    @CacheEvict(value = {"dashboardSummary", "dashboardTrends"}, allEntries = true)
    @Transactional
    public Wallet update(Long walletId, WalletUpdateRequest request, UserPrincipal actor) {
        Wallet wallet = findOwned(walletId, actor);

        String masked = trimToNull(request.getCardNumberMasked());
        if (masked != null && TOO_MANY_CONSECUTIVE_DIGITS.matcher(masked).find()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Chỉ được lưu số thẻ đã che, không lưu số thẻ đầy đủ");
        }

        if (request.getType() != WalletType.CREDIT_CARD
                && wallet.getBalance().compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Ví đang âm số dư nên phải giữ loại CREDIT_CARD");
        }

        wallet.setWalletName(request.getWalletName().trim());
        wallet.setType(request.getType());
        if (request.getCurrency() != null && !request.getCurrency().isBlank()) {
            wallet.setCurrency(request.getCurrency().trim());
        }
        wallet.setCardNumberMasked(masked);

        Wallet saved = walletRepository.save(wallet);
        log.info("Cập nhật ví id={} bởi user={} tên={} loại={}",
                saved.getId(), actor.getId(), saved.getWalletName(), saved.getType());
        return saved;
    }

    @CacheEvict(value = {"dashboardSummary", "dashboardTrends"}, allEntries = true)
    @Transactional
    public void delete(Long walletId, UserPrincipal actor) {
        Wallet wallet = findOwned(walletId, actor);

        if (transactionRepository.existsByWalletId(walletId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Ví đã có giao dịch nên không thể xoá; xoá ví sẽ xoá luôn lịch sử theo ON DELETE CASCADE");
        }

        walletRepository.delete(wallet);
        log.info("Xoá ví id={} bởi user={}", walletId, actor.getId());
    }

    private Wallet findOwned(Long walletId, UserPrincipal actor) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ví không tồn tại"));

        Long ownerId = wallet.getUser() == null ? null : wallet.getUser().getId();
        if (ownerId == null || !ownerId.equals(actor.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Ví không tồn tại");
        }
        return wallet;
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
