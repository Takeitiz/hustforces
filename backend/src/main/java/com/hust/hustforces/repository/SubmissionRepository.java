package com.hust.hustforces.repository;

import com.hust.hustforces.enums.SubmissionState;
import com.hust.hustforces.model.entity.Submission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Integer> {
    @Query("SELECT DISTINCT s FROM Submission s LEFT JOIN FETCH s.testcases t WHERE s.id = :id")
    Optional<Submission> findByIdWithTestcases(@Param("id") String id);

    @Query("SELECT s FROM Submission s " +
            "LEFT JOIN FETCH s.activeContest " +
            "LEFT JOIN FETCH s.problem " +
            "WHERE s.id = :submissionId")
    Optional<Submission> findByIdWithContestAndProblem(@Param("submissionId") String submissionId);

    List<Submission> findByUserIdAndProblemIdOrderByCreatedAtDesc(String userId, String problemId);

    Page<Submission> findByUserId(String userId, Pageable pageable);

    List<Submission> findByActiveContestId(String contestId);

    Optional<Submission> findById(String submissionId);

    @Query("SELECT s FROM Submission s LEFT JOIN FETCH s.contestSubmission WHERE s.id = :submissionId")
    Optional<Submission> findByIdWithContestSubmission(@Param("submissionId") String submissionId);

    List<Submission> findByStateAndCreatedAtBefore(SubmissionState submissionState, LocalDateTime cutoffTime, PageRequest of);

    // Count total submissions by user
    @Query("SELECT COUNT(s) FROM Submission s WHERE s.userId = :userId")
    int countByUserId(@Param("userId") String userId);

    // Count accepted submissions by user
    @Query("SELECT COUNT(s) FROM Submission s WHERE s.userId = :userId AND s.status = 'AC'")
    int countByUserIdAndStatusAC(@Param("userId") String userId);

    // Count distinct problems solved by user
    @Query("SELECT COUNT(DISTINCT s.problemId) FROM Submission s WHERE s.userId = :userId AND s.status = 'AC'")
    int countDistinctProblemsByUserIdAndStatusAC(@Param("userId") String userId);

    // Count problems solved by difficulty
    @Query("SELECT p.difficulty, COUNT(DISTINCT s.problemId) FROM Submission s " +
            "JOIN Problem p ON s.problemId = p.id " +
            "WHERE s.userId = :userId AND s.status = 'AC' " +
            "GROUP BY p.difficulty")
    List<Object[]> countProblemsByDifficultyForUser(@Param("userId") String userId);

    // Group submissions by date for calendar heatmap
    @Query("SELECT FUNCTION('TO_CHAR', s.createdAt, 'YYYY-MM-DD'), COUNT(s) " +
            "FROM Submission s WHERE s.userId = :userId " +
            "GROUP BY FUNCTION('TO_CHAR', s.createdAt, 'YYYY-MM-DD')")
    List<Object[]> countSubmissionsByDateForUser(@Param("userId") String userId);

    // Get recent submissions efficiently
    @Query("SELECT s FROM Submission s WHERE s.userId = :userId ORDER BY s.createdAt DESC")
    List<Submission> findRecentSubmissionsByUserId(@Param("userId") String userId, Pageable pageable);

    int countByProblemId(String problemId);

    @Query("SELECT COUNT(DISTINCT s.id) FROM Submission s WHERE s.problemId = :problemId AND s.status = 'AC'")
    int countByProblemIdAndStatusAC(@Param("problemId") String problemId);

    @Query("SELECT DISTINCT s FROM Submission s " +
            "LEFT JOIN FETCH s.testcases t " +
            "WHERE s.state = :state AND s.createdAt < :cutoffTime")
    List<Submission> findStalledSubmissionsWithTestcases(
            @Param("state") SubmissionState state,
            @Param("cutoffTime") LocalDateTime cutoffTime,
            Pageable pageable);
}