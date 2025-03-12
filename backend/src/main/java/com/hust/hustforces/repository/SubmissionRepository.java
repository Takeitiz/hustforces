package com.hust.hustforces.repository;

import com.hust.hustforces.enums.SubmissionResult;
import com.hust.hustforces.model.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Integer> {
    @Query("SELECT s FROM Submission s LEFT JOIN FETCH s.testcases WHERE s.id = :id")
    Optional<Submission> findByIdWithTestcases(@Param("id") String id);

    @Query("SELECT DISTINCT s FROM Submission s LEFT JOIN FETCH s.testcases " +
            "WHERE s.status = :status " +
            "ORDER BY s.id ASC")
    List<Submission> findPendingSubmissions(@Param("status") SubmissionResult status, Pageable pageable);

    @Query("SELECT s FROM Submission s " +
            "LEFT JOIN FETCH s.activeContest " +
            "LEFT JOIN FETCH s.problem " +
            "WHERE s.id = :submissionId")
    Optional<Submission> findByIdWithContestAndProblem(@Param("submissionId") String submissionId);
}
