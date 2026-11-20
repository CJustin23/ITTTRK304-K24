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

    private final SavingGoalRepository savingGoalRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;

    @Transactional
    public SavingGoalResponse createGoal(Long userId, SavingGoalRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tài khoản không tồn tại"));

        LocalDate deadline = request.getDeadline() != null ? request.getDeadline() : request.getTargetDate();
        BigDecimal current = request.getCurrentAmount() != null ? request.getCurrentAmount() : BigDecimal.ZERO;
        GoalStatus status = request.getStatus() != null ? request.getStatus() : GoalStatus.IN_PROGRESS;

        if (current.compareTo(request.getTargetAmount()) >= 0) {
            status = GoalStatus.COMPLETED;
        }

        SavingGoal goal = SavingGoal.builder()
                .user(user)
                .goalName(request.getGoalName().trim())
                .targetAmount(request.getTargetAmount())
                .currentAmount(current)
                .deadline(deadline)
                .status(status)
                .build();

        SavingGoal saved = savingGoalRepository.save(goal);
        log.info("Tạo mục tiêu tiết kiệm mới id={} user={} target={}", saved.getId(), userId, saved.getTargetAmount());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<SavingGoalResponse> getUserGoals(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user != null && user.getFamilyGroupId() != null && !user.getFamilyGroupId().isBlank()) {
            List<Long> familyMemberIds = userRepository.findByFamilyGroupId(user.getFamilyGroupId())
                    .stream()
                    .map(User::getId)
                    .toList();
            if (!familyMemberIds.isEmpty()) {
                return savingGoalRepository.findByUserIdIn(familyMemberIds).stream()
                        .map(this::toResponse)
                        .toList();
            }
        }
        return savingGoalRepository.findByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    private boolean canAccessGoal(SavingGoal goal, User user) {
        if (goal.getUser().getId().equals(user.getId())) return true;
        if (user.getFamilyGroupId() != null && !user.getFamilyGroupId().isBlank()
                && goal.getUser().getFamilyGroupId() != null) {
            return user.getFamilyGroupId().equals(goal.getUser().getFamilyGroupId());
        }
        return false;
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
                .filter(g -> canAccessGoal(g, user))
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

        Transaction tx = Transaction.builder()
                .user(user)
                .wallet(wallet)
                .category(cat)
                .actionTitle("Nạp tiền tích lũy: " + goal.getGoalName())
                .amount(depositAmount)
                .transactionType(TransactionType.EXPENSE)
                .balanceAfter(wallet.getBalance())
                .transactionDate(LocalDateTime.now())
                .note("Trích tiền từ " + wallet.getWalletName() + " vào mục tiêu: " + goal.getGoalName())
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
            String title = "Nạp tiền tích lũy: " + g.getGoalName();
            List<Object[]> rows = transactionRepository.getGoalContributors(title);
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

        return SavingGoalResponse.builder()
                .id(g.getId())
                .goalName(g.getGoalName())
                .targetAmount(g.getTargetAmount())
                .currentAmount(g.getCurrentAmount())
                .deadline(g.getDeadline())
                .status(g.getStatus())
                .progressPercentage(percentage)
                .contributors(contributors)
                .createdAt(g.getCreatedAt())
                .updatedAt(g.getUpdatedAt())
                .build();
    }
}

