package com.hust.hustforces.repository;

import com.hust.hustforces.model.entity.UserBadge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserBadgeRepository extends JpaRepository<UserBadge, String> {

    List<UserBadge> findByUserId(String userId);

    @Query("SELECT ub FROM UserBadge ub " +
            "JOIN FETCH ub.badge " +
            "WHERE ub.userId = :userId " +
            "ORDER BY ub.awardedAt DESC")
    List<UserBadge> findByUserIdWithBadges(@Param("userId") String userId);

    boolean existsByUserIdAndBadgeId(String userId, Long badgeId);
}