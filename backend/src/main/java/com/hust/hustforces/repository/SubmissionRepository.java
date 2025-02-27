package com.hust.hustforces.repository;

import com.hust.hustforces.model.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Integer> {
    @Query("SELECT s FROM Submission s LEFT JOIN FETCH s.testcases WHERE s.id = :id")
    Optional<Submission> findByIdWithTestcases(@Param("id") String id);
}
