package com.budglee.finance.repository;

import com.budglee.finance.entity.Category;
import com.budglee.finance.entity.CategoryType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    @Query("SELECT c FROM Category c WHERE c.user.id = :userId OR c.user IS NULL")
    List<Category> findAllAvailableForUser(@Param("userId") Long userId);

    @Query("SELECT c FROM Category c WHERE (c.user.id = :userId OR c.user IS NULL) AND c.type = :type")
    List<Category> findByUserIdAndType(@Param("userId") Long userId, @Param("type") CategoryType type);
}
