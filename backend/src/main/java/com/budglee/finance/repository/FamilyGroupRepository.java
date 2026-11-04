package com.budglee.finance.repository;

import com.budglee.finance.entity.FamilyGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FamilyGroupRepository extends JpaRepository<FamilyGroup, String> {

    Optional<FamilyGroup> findByIdAndCreatedById(
            String id,
            Long createdById
    );
}
