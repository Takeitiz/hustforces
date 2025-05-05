package com.hust.hustforces.repository;

import com.hust.hustforces.enums.SubmissionResult;
import com.hust.hustforces.enums.SubmissionState;
import com.hust.hustforces.model.entity.Submission;
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

    List<Submission> findByUserId(String userId);

    List<Submission> findByActiveContestId(String contestId);

    Optional<Submission> findById(String submissionId);

    @Query("SELECT s FROM Submission s LEFT JOIN FETCH s.contestSubmission WHERE s.id = :submissionId")
    Optional<Submission> findByIdWithContestSubmission(@Param("submissionId") String submissionId);

    List<Submission> findByStateAndCreatedAtBefore(SubmissionState submissionState, LocalDateTime cutoffTime, PageRequest of);
}
