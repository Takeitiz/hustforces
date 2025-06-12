// Enhanced UserStatsRepository.java
package com.hust.hustforces.repository;

import com.hust.hustforces.model.entity.UserStats;
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
public interface UserStatsRepository extends JpaRepository<UserStats, String> {
    // Existing methods
    List<UserStats> findTop50ByOrderByLastCalculatedAsc();

    @Query("SELECT us FROM UserStats us WHERE us.lastCalculated IS NULL")
    List<UserStats> findByLastCalculatedIsNull();

    // New methods for standings feature
    Optional<UserStats> findByUserId(String userId);

    @Query("SELECT us FROM UserStats us WHERE us.lastCalculated > :date ORDER BY us.currentRank DESC")
    Page<UserStats> findAllByLastActiveAfterOrderByRatingDesc(@Param("date") LocalDateTime date, Pageable pageable);

    @Query("SELECT us FROM UserStats us WHERE us.lastCalculated > :date ORDER BY us.problemsSolved DESC")
    Page<UserStats> findAllByLastActiveAfterOrderByProblemsSolvedDesc(@Param("date") LocalDateTime date, Pageable pageable);

    @Query("SELECT COUNT(us) + 1 FROM UserStats us WHERE us.currentRank > " +
            "(SELECT us2.currentRank FROM UserStats us2 WHERE us2.userId = :userId)")
    int findUserRankByRating(@Param("userId") String userId);

    @Query("SELECT COUNT(us) + 1 FROM UserStats us WHERE us.problemsSolved > " +
            "(SELECT us2.problemsSolved FROM UserStats us2 WHERE us2.userId = :userId)")
    int findUserRankByProblemsSolved(@Param("userId") String userId);

    @Query("SELECT us FROM UserStats us " +
            "JOIN FETCH us.user u " +
            "WHERE LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "AND us.lastCalculated > :startDate " +
            "ORDER BY us.currentRank DESC")
    Page<UserStats> searchByUsernameAndTimeRange(
            @Param("query") String query,
            @Param("startDate") LocalDateTime startDate,
            Pageable pageable);

    @Query("SELECT COUNT(DISTINCT us.userId) FROM UserStats us")
    long countDistinctUsers();

    // For top performers
    @Query("SELECT us FROM UserStats us ORDER BY us.currentRank DESC")
    Page<UserStats> findAllByOrderByRatingDesc(Pageable pageable);

    Page<UserStats> findAllByOrderByProblemsSolvedDesc(Pageable pageable);

    // For badge awarding
    List<UserStats> findAllByProblemsSolvedGreaterThanEqual(int threshold);
    List<UserStats> findAllByContestsGreaterThanEqual(int threshold);

    @Query("SELECT us FROM UserStats us WHERE (us.currentRank - us.maxRank) >= :increase")
    List<UserStats> findAllByRatingIncreaseGreaterThanEqual(@Param("increase") int increase);
}