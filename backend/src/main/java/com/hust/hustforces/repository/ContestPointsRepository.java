package com.hust.hustforces.repository;

import com.hust.hustforces.model.entity.ContestPoints;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContestPointsRepository extends JpaRepository<ContestPoints, String> {
    List<ContestPoints> findByContestIdOrderByRankAsc(String contestId);

    Optional<ContestPoints> findByContestIdAndUserId(String contestId, String userId);

    /**
     * Find leaderboard for a contest with user details
     */
    @Query("SELECT cp FROM ContestPoints cp " +
            "JOIN FETCH cp.user u " +
            "WHERE cp.contestId = :contestId " +
            "ORDER BY cp.rank ASC")
    List<ContestPoints> findContestLeaderboardWithUsers(@Param("contestId") String contestId);

    /**
     * Count participants in a contest
     */
    long countByContestId(String contestId);

    /**
     * Get user's historical contest participations
     */
    @Query("SELECT cp FROM ContestPoints cp " +
            "JOIN FETCH cp.contest c " +
            "WHERE cp.userId = :userId " +
            "AND c.finalized = true " +
            "ORDER BY c.endTime DESC")
    List<ContestPoints> findUserContestHistory(@Param("userId") String userId);
}
