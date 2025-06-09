package com.hust.hustforces.repository;

import com.hust.hustforces.model.entity.Contest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ContestRepository extends JpaRepository<Contest, String> {

    /**
     * Find visible contests with problems eagerly loaded
     */
    @Query("SELECT DISTINCT c FROM Contest c " +
            "LEFT JOIN FETCH c.problems p " +
            "LEFT JOIN FETCH p.problem " +
            "WHERE c.hidden = false " +
            "ORDER BY c.startTime DESC")
    List<Contest> findAllVisibleWithProblems();

    /**
     * Find paginated visible contests (for listing without problems)
     */
    Page<Contest> findByHiddenFalseOrderByStartTimeDesc(Pageable pageable);

    /**
     * Find a contest by ID with problems eagerly loaded
     */
    @Query("SELECT c FROM Contest c " +
            "LEFT JOIN FETCH c.problems p " +
            "LEFT JOIN FETCH p.problem " +
            "WHERE c.id = :contestId")
    Optional<Contest> findByIdWithProblems(@Param("contestId") String contestId);

    /**
     * Find a contest by ID that is not hidden
     */
    Optional<Contest> findByIdAndHiddenFalse(String contestId);

    /**
     * Find active contests with problems eagerly loaded
     */
    @Query("SELECT DISTINCT c FROM Contest c " +
            "LEFT JOIN FETCH c.problems p " +
            "LEFT JOIN FETCH p.problem " +
            "WHERE c.hidden = false " +
            "AND c.startTime <= :now " +
            "AND c.endTime > :now " +
            "ORDER BY c.endTime ASC")
    List<Contest> findActiveContestsWithProblems(@Param("now") LocalDateTime now);

    /**
     * Find active contests without problems (for light queries)
     */
    @Query("SELECT c FROM Contest c WHERE c.hidden = false AND c.startTime <= :now AND c.endTime > :now ORDER BY c.endTime ASC")
    List<Contest> findActiveContests(@Param("now") LocalDateTime now);

    /**
     * Find upcoming contests with problems eagerly loaded
     */
    @Query("SELECT DISTINCT c FROM Contest c " +
            "LEFT JOIN FETCH c.problems p " +
            "LEFT JOIN FETCH p.problem " +
            "WHERE c.hidden = false " +
            "AND c.startTime > :now " +
            "ORDER BY c.startTime ASC")
    List<Contest> findUpcomingContestsWithProblems(@Param("now") LocalDateTime now);

    /**
     * Find upcoming contests without problems
     */
    @Query("SELECT c FROM Contest c WHERE c.hidden = false AND c.startTime > :now ORDER BY c.startTime ASC")
    List<Contest> findUpcomingContests(@Param("now") LocalDateTime now);

    /**
     * Find past contests
     */
    @Query("SELECT c FROM Contest c WHERE c.hidden = false AND c.endTime <= :now ORDER BY c.endTime DESC")
    Page<Contest> findPastContests(@Param("now") LocalDateTime now, Pageable pageable);

    /**
     * Search contests by title with pagination
     */
    @Query("SELECT c FROM Contest c WHERE c.hidden = false AND LOWER(c.title) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY c.startTime DESC")
    Page<Contest> searchContests(@Param("query") String query, Pageable pageable);

    /**
     * Count active contests
     */
    @Query("SELECT COUNT(c) FROM Contest c WHERE c.hidden = false AND c.startTime <= :now AND c.endTime > :now")
    long countActiveContests(@Param("now") LocalDateTime now);

    /**
     * Check if a contest exists and is active
     */
    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END FROM Contest c " +
            "WHERE c.id = :contestId AND c.hidden = false " +
            "AND c.startTime <= :now AND c.endTime > :now")
    boolean isContestActive(@Param("contestId") String contestId, @Param("now") LocalDateTime now);
}