package com.hust.hustforces.repository;

import com.hust.hustforces.model.entity.Problem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProblemRepository extends JpaRepository<Problem, String> {
    Optional<Problem> findBySlug(String slug);

    @Query("SELECT p FROM Problem p " +
            "LEFT JOIN FETCH p.defaultCode " +
            "WHERE p.id = :problemId " +
            "AND EXISTS (SELECT cp FROM ContestProblem cp WHERE cp.problemId = p.id AND cp.contestId = :contestId)")
    Optional<Problem> findByIdWithDefaultCodeAndInContest(@Param("problemId") String problemId, @Param("contestId") String contestId);

    @Query("SELECT p FROM Problem p " +
            "LEFT JOIN FETCH p.defaultCode " +
            "WHERE p.id = :problemId")
    Optional<Problem> findByIdWithDefaultCode(@Param("problemId") String problemId);

    @Query("SELECT p FROM Problem p " +
            "LEFT JOIN FETCH p.defaultCode " +
            "WHERE p.hidden = false")
    List<Problem> getAllNotHiddenProblemsWithDefaultCode();
}
