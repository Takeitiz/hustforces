package com.hust.hustforces.repository;

import com.hust.hustforces.model.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    @Query("SELECT DISTINCT u FROM User u " +
            "LEFT JOIN FETCH u.contestPoints " +
            "WHERE u.id = :userId")
    Optional<User> findByIdWithContestPoints(@Param("userId") String userId);

    @Query("SELECT DISTINCT u FROM User u " +
            "LEFT JOIN FETCH u.contestPoints cp " +
            "WHERE u.id IN (" +
            "  SELECT us.userId FROM UserStats us " +
            "  WHERE us.lastCalculated IS NULL " +
            "  OR us.lastCalculated < :cutoffTime" +
            ") " +
            "ORDER BY u.createdAt")
    List<User> findUsersNeedingStatsUpdate(@Param("cutoffTime") LocalDateTime cutoffTime);

    @Query("SELECT u FROM User u " +
            "WHERE u.id NOT IN (" +
            "  SELECT us.userId FROM UserStats us" +
            ")")
    List<User> findUsersWithoutStats();

    @Query("SELECT DISTINCT u FROM User u " +
            "LEFT JOIN FETCH u.contestPoints " +
            "ORDER BY u.createdAt")
    List<User> findAllWithContestPoints();

    List<User> findByUsernameContainingIgnoreCase(String username);

    @Query("SELECT u FROM User u WHERE " +
            "LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<User> searchUsers(@Param("search") String search, Pageable pageable);
}
