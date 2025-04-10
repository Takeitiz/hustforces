package com.hust.hustforces.repository;

import com.hust.hustforces.model.entity.ContestSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContestSubmissionRepository extends JpaRepository<ContestSubmission, String> {
    List<ContestSubmission> findByContestIdAndUserIdOrderByPointsDesc(String contestId, String userId);

    Optional<ContestSubmission> findByUserIdAndProblemIdAndContestId(String userId, String problemId, String contestId);

    @Query("SELECT cs FROM ContestSubmission cs WHERE cs.contestId = :contestId ORDER BY cs.userId, cs.problemId")
    List<ContestSubmission> findAllByContestId(@Param("contestId") String contestId);

    @Query("SELECT COUNT(DISTINCT cs.userId) FROM ContestSubmission cs WHERE cs.contestId = :contestId")
    int countDistinctParticipantsByContestId(@Param("contestId") String contestId);

    @Query("SELECT COUNT(cs) FROM ContestSubmission cs WHERE cs.contestId = :contestId AND cs.problemId = :problemId")
    int countSubmissionsByContestIdAndProblemId(@Param("contestId") String contestId, @Param("problemId") String problemId);
}
