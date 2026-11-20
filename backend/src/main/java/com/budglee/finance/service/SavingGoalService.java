package com.budglee.finance.service;

import com.budglee.finance.dto.SavingGoalDepositRequest;
import com.budglee.finance.dto.SavingGoalRequest;
import com.budglee.finance.dto.SavingGoalResponse;
import com.budglee.finance.dto.SavingGoalUpdateRequest;
import com.budglee.finance.entity.*;
import com.budglee.finance.repository.CategoryRepository;
import com.budglee.finance.repository.SavingGoalRepository;
import com.budglee.finance.repository.TransactionRepository;
import com.budglee.finance.repository.UserRepository;
import com.budglee.finance.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SavingGoalService {

    private static final String FAMILY_PREFIX = "[FAMILY] ";

    private final SavingGoalRepository savingGoalRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;

    private boolean isFamilyGoal(SavingGoal goal) {
        return goal != null && goal.getGoalName() != null && goal.getGoalName().startsWith(FAMILY_PREFIX);
    }

    private String cleanGoalName(SavingGoal goal) {
        if (goal == null || goal.getGoalName() == null) return "";
        String raw = goal.getGoalName();
        return raw.startsWith(FAMILY_PREFIX) ? raw.substring(FAMILY_PREFIX.length()).trim() : raw;
    }

    @Transactional
    public SavingGoalResponse createGoal(Long userId, SavingGoalRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tài khoản không tồn tại"));

        boolean isFam = Boolean.TRUE.equals(request.getFamilyGoal());
        if (isFam && (user.getFamilyGroupId() == null || user.getFamilyGroupId().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tài khoản chưa tham gia nhóm hộ gia đình");
        }

        LocalDate deadline = request.getDeadline() != null ? request.getDeadline() : request.getTargetDate();
        BigDecimal current = request.getCurrentAmount() != null ? request.getCurrentAmount() : BigDecimal.ZERO;
        GoalStatus status = request.getStatus() != null ? request.getStatus() : GoalStatus.IN_PROGRESS;

        if (current.compareTo(request.getTargetAmount()) >= 0) {
            status = GoalStatus.COMPLETED;
        }

        String cleanName = request.getGoalName().trim();
        if (cleanName.startsWith(FAMILY_PREFIX)) {
            cleanName = cleanName.substring(FAMILY_PREFIX.length()).trim();
        }
        String storedName = isFam ? (FAMILY_PREFIX + cleanName) : cleanName;

        if (current.compareTo(BigDecimal.ZERO) > 0 && request.getFromWalletId() != null) {
            Wallet wallet = walletRepository.findById(request.getFromWalletId())
                    .filter(w -> w.getUser() != null && (w.getUser().getId().equals(userId)
                            || (user.getFamilyGroupId() != null && user.getFamilyGroupId().equals(w.getFamilyGroupId()))))
                    .orElse(null);
            if (wallet != null) {
                wallet.setBalance(wallet.getBalance().subtract(current));
                walletRepository.save(wallet);
                Category cat = categoryRepository.findByUserIdAndType(userId, CategoryType.EXPENSE)
                        .stream().findFirst().orElse(null);
                Transaction tx = Transaction.builder()
                        .user(user)
                        .wallet(wallet)
                        .category(cat)
                        .actionTitle("Nạp tiền tích lũy: " + cleanName)
                        .amount(current)
                        .transactionType(TransactionType.EXPENSE)
                        .balanceAfter(wallet.getBalance())
                        .transactionDate(LocalDateTime.now())
                        .note("Trích tiền từ " + wallet.getWalletName() + " vào mục tiêu: " + cleanName)
                        .build();
                transactionRepository.save(tx);
            }
        }

        SavingGoal goal = SavingGoal.builder()
                .user(user)
                .goalName(storedName)
                .targetAmount(request.getTargetAmount())
                .currentAmount(current)
                .deadline(deadline)
                .status(status)
                .build();

        SavingGoal saved = savingGoalRepository.save(goal);
        log.info("Tạo mục tiêu tiết kiệm mới id={} user={} family={} target={}", saved.getId(), userId, isFam, saved.getTargetAmount());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<SavingGoalResponse> getUserGoals(Long userId) {
        return savingGoalRepository.findByUserId(userId).stream()
                .filter(g -> !isFamilyGoal(g))
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SavingGoalResponse> getFamilyGoals(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tài khoản không tồn tại"));
        String famId = user.getFamilyGroupId();
        if (famId == null || famId.isBlank()) {
            return List.of();
        }
        List<Long> memberIds = userRepository.findByFamilyGroupIdOrderByIdAsc(famId).stream()
                .map(User::getId)
                .toList();
        if (memberIds.isEmpty()) {
            return List.of();
        }
        return savingGoalRepository.findByUserIdIn(memberIds).stream()
                .filter(this::isFamilyGoal)
                .map(this::toResponse)
                .toList();
    }

    private boolean canAccessGoal(SavingGoal goal, User user) {
        if (isFamilyGoal(goal)) {
            return user.getFamilyGroupId() != null && !user.getFamilyGroupId().isBlank()
                    && goal.getUser() != null
                    && user.getFamilyGroupId().equals(goal.getUser().getFamilyGroupId());
        }
        return goal.getUser() != null && goal.getUser().getId().equals(user.getId());
    }

    @Transactional(readOnly = true)
    public SavingGoalResponse getGoalById(Long userId, Long goalId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tài khoản không tồn tại"));
        SavingGoal goal = savingGoalRepository.findById(goalId)
                .filter(g -> canAccessGoal(g, user))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mục tiêu tiết kiệm không tồn tại"));
        return toResponse(goal);
    }

    @Transactional
    public SavingGoalResponse updateGoal(Long userId, Long goalId, SavingGoalUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tài khoản không tồn tại"));
        SavingGoal goal = savingGoalRepository.findById(goalId)
                .filter(g -> g.getUser().getId().equals(userId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mục tiêu tiết kiệm không tồn tại"));

        if (request.getGoalName() != null && !request.getGoalName().isBlank()) {
            goal.setGoalName(request.getGoalName().trim());
        }
        if (request.getTargetAmount() != null && request.getTargetAmount().compareTo(BigDecimal.ZERO) > 0) {
            goal.setTargetAmount(request.getTargetAmount());
        }
        if (request.getCurrentAmount() != null) {
            goal.setCurrentAmount(request.getCurrentAmount());
        }
        LocalDate deadline = request.getDeadline() != null ? request.getDeadline() : request.getTargetDate();
        if (deadline != null) {
            goal.setDeadline(deadline);
        }
        if (request.getStatus() != null) {
            goal.setStatus(request.getStatus());
        }

        if (goal.getCurrentAmount().compareTo(goal.getTargetAmount()) >= 0 && goal.getStatus() == GoalStatus.IN_PROGRESS) {
            goal.setStatus(GoalStatus.COMPLETED);
        }

        SavingGoal updated = savingGoalRepository.save(goal);
        return toResponse(updated);
    }

    @CacheEvict(value = {"dashboardSummary", "dashboardTrends"}, allEntries = true)
    @Transactional
    public SavingGoalResponse depositToGoal(Long userId, Long goalId, SavingGoalDepositRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tài khoản không tồn tại"));
        SavingGoal goal = savingGoalRepository.findById(goalId)
                .filter(g -> canAccessGoal(g, user))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mục tiêu tiết kiệm không tồn tại"));

        BigDecimal depositAmount = request.getAmount();
        if (depositAmount == null || depositAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số tiền nạp phải lớn hơn 0");
        }

        // Bắt buộc phải có nguồn tiền (Ví / Thẻ) hợp lệ
        if (request.getFromWalletId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phải có nguồn tiền (Ví / Thẻ) để nạp vào mục tiêu tiết kiệm");
        }

        Wallet wallet = walletRepository.findById(request.getFromWalletId())
                .filter(w -> w.getUser() != null && (w.getUser().getId().equals(userId)
                        || (user.getFamilyGroupId() != null && user.getFamilyGroupId().equals(w.getFamilyGroupId()))))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ví nạp tiền không tồn tại"));

        if (wallet.getBalance().compareTo(depositAmount) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số dư nguồn tiền không đủ để nạp vào mục tiêu tiết kiệm");
        }

        wallet.setBalance(wallet.getBalance().subtract(depositAmount));
        walletRepository.save(wallet);

        Category cat = categoryRepository.findByUserIdAndType(userId, CategoryType.EXPENSE)
                .stream().findFirst().orElse(null);

        String cleanName = cleanGoalName(goal);
        Transaction tx = Transaction.builder()
                .user(user)
                .wallet(wallet)
                .category(cat)
                .actionTitle("Nạp tiền tích lũy: " + cleanName)
                .amount(depositAmount)
                .transactionType(TransactionType.EXPENSE)
                .balanceAfter(wallet.getBalance())
                .transactionDate(LocalDateTime.now())
                .note("Trích tiền từ " + wallet.getWalletName() + " vào mục tiêu: " + cleanName)
                .build();
        transactionRepository.save(tx);

        BigDecimal newCurrent = goal.getCurrentAmount().add(depositAmount);
        goal.setCurrentAmount(newCurrent);

        if (newCurrent.compareTo(goal.getTargetAmount()) >= 0) {
            goal.setStatus(GoalStatus.COMPLETED);
        }

        SavingGoal saved = savingGoalRepository.save(goal);
        log.info("Nạp {} vào mục tiêu id={}, số dư hiện tại={}", depositAmount, goalId, newCurrent);
        return toResponse(saved);
    }

    @Transactional
    public void deleteGoal(Long userId, Long goalId) {
        SavingGoal goal = savingGoalRepository.findById(goalId)
                .filter(g -> g.getUser().getId().equals(userId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mục tiêu tiết kiệm không tồn tại"));

        savingGoalRepository.delete(goal);
        log.info("Đã xóa mục tiêu tiết kiệm id={} user={}", goalId, userId);
    }

    private List<SavingGoalResponse.GoalContributorDto> findContributorsForGoal(SavingGoal g) {
        try {
            String cleanName = cleanGoalName(g);
            String title = "Nạp tiền tích lũy: " + cleanName;
            String famId = g.getUser() != null ? g.getUser().getFamilyGroupId() : null;
            List<Object[]> rows = (isFamilyGoal(g) && famId != null && !famId.isBlank())
                    ? transactionRepository.getGoalContributorsByFamily(title, famId)
                    : transactionRepository.getGoalContributors(title);
            if (rows == null || rows.isEmpty()) return List.of();

            BigDecimal goalCurrent = g.getCurrentAmount() != null && g.getCurrentAmount().compareTo(BigDecimal.ZERO) > 0
                    ? g.getCurrentAmount() : BigDecimal.ONE;

            return rows.stream().map(r -> {
                Long uid = (Long) r[0];
                String name = (String) r[1];
                String email = (String) r[2];
                String avatar = (String) r[3];
                BigDecimal amount = (BigDecimal) r[4];
                long count = ((Number) r[5]).longValue();
                LocalDateTime lastAt = (LocalDateTime) r[6];

                int pct = 0;
                if (amount != null && goalCurrent.compareTo(BigDecimal.ZERO) > 0) {
                    pct = amount.divide(goalCurrent, 2, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100))
                            .intValue();
                    pct = Math.min(100, Math.max(0, pct));
                }

                return SavingGoalResponse.GoalContributorDto.builder()
                        .userId(uid)
                        .userName(name != null ? name : "Thành viên gia đình")
                        .userEmail(email)
                        .avatarUrl(avatar)
                        .totalAmount(amount != null ? amount : BigDecimal.ZERO)
                        .depositCount((int) count)
                        .percentage(pct)
                        .lastDepositAt(lastAt)
                        .build();
            }).toList();
        } catch (Exception ex) {
            log.warn("Không thể tải danh sách đóng góp cho mục tiêu id={}: {}", g.getId(), ex.getMessage());
            return List.of();
        }
    }

    private SavingGoalResponse toResponse(SavingGoal g) {
        double percentage = 0.0;
        if (g.getTargetAmount() != null && g.getTargetAmount().compareTo(BigDecimal.ZERO) > 0) {
            percentage = g.getCurrentAmount()
                    .divide(g.getTargetAmount(), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
            percentage = Math.min(percentage, 100.0);
        }

        List<SavingGoalResponse.GoalContributorDto> contributors = findContributorsForGoal(g);
        boolean isFam = isFamilyGoal(g);

        return SavingGoalResponse.builder()
                .id(g.getId())
                .goalName(cleanGoalName(g))
                .targetAmount(g.getTargetAmount())
                .currentAmount(g.getCurrentAmount())
                .deadline(g.getDeadline())
                .status(g.getStatus())
                .progressPercentage(percentage)
                .familyGoal(isFam)
                .familyGroupId(isFam && g.getUser() != null ? g.getUser().getFamilyGroupId() : null)
                .contributors(contributors)
                .createdAt(g.getCreatedAt())
                .updatedAt(g.getUpdatedAt())
                .build();
    }
}

