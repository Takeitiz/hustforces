package com.hust.hustforces.repository;

import com.hust.hustforces.model.entity.Discussion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DiscussionRepository extends JpaRepository<Discussion, String> {
    @Query("SELECT d FROM Discussion d WHERE d.id = :id")
    Optional<Discussion> findById(@Param("id") String id);

    Page<Discussion> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Discussion> findByProblemIdOrderByCreatedAtDesc(String problemId, Pageable pageable);

    Page<Discussion> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    @Query("SELECT d FROM Discussion d WHERE " +
            "LOWER(d.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(d.content) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Discussion> searchDiscussions(@Param("query") String query, Pageable pageable);
}
