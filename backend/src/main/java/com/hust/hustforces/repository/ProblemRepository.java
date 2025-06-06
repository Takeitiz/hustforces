package com.hust.hustforces.repository;

import com.hust.hustforces.enums.Difficulty;
import com.hust.hustforces.model.entity.Problem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProblemRepository extends JpaRepository<Problem, String> {
    Optional<Problem> findBySlug(String slug);

    boolean existsBySlug(String slug);

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
    Page<Problem> findAllNotHiddenProblemsWithDefaultCode(Pageable pageable);

    @Query("SELECT p FROM Problem p " +
            "WHERE p.hidden = false " +
            "AND (:search IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.slug) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND (:difficulty IS NULL OR p.difficulty = :difficulty)")
    Page<Problem> searchProblems(@Param("search") String search,
                                 @Param("difficulty") Difficulty difficulty,
                                 Pageable pageable);
}
