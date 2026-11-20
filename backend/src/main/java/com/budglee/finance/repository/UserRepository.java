package com.budglee.finance.repository;

import com.budglee.finance.entity.Role;
import com.budglee.finance.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    long countByRole(Role role);
    long countByRoleAndEnabled(Role role, Boolean enabled);
    long countByEnabled(Boolean enabled);
    List<User> findByFamilyGroupId(String familyGroupId);
    boolean existsByFamilyGroupIdAndId(String familyGroupId, Long id);
}
