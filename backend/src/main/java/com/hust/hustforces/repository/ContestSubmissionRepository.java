package com.hust.hustforces.repository;

import com.hust.hustforces.model.entity.ContestSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface  ContestSubmissionRepository extends JpaRepository<ContestSubmission, String> {

    Optional<ContestSubmission> findByUserIdAndProblemIdAndContestId(String userId, String problemId, String contestId);
}
