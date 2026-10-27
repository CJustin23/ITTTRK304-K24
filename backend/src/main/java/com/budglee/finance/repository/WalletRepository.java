package com.budglee.finance.repository;

import com.budglee.finance.entity.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, Long> {
    List<Wallet> findByUserId(Long userId);
    List<Wallet> findByFamilyGroupId(String familyGroupId);

    @Query("SELECT COALESCE(SUM(w.balance), 0) FROM Wallet w WHERE w.user.id = :userId")
    BigDecimal getTotalBalanceByUserId(@Param("userId") Long userId);
}
