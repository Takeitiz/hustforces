package com.hust.hustforces.repository;

import com.hust.hustforces.model.entity.Solution;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SolutionRepository extends JpaRepository<Solution, String> {
    @Query("SELECT s FROM Solution s WHERE s.id = :id")
    Optional<Solution> findById(@Param("id") String id);

    Page<Solution> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Solution> findByProblemIdOrderByUpvotesDesc(String problemId, Pageable pageable);

    Page<Solution> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);
}
