package com.hust.hustforces.repository;

import com.hust.hustforces.model.entity.ContestProblem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContestProblemRepository extends JpaRepository<ContestProblem, String> {
    List<ContestProblem> findByContestIdOrderByIndex(String contestId);

    Optional<ContestProblem> findByContestIdAndProblemId(String contestId, String problemId);
}
