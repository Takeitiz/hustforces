package com.hust.hustforces.repository;

import com.hust.hustforces.model.entity.Contest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ContestRepository extends JpaRepository<Contest, String> {

    // Find by ID and only if visible
    @Query("SELECT c FROM Contest c WHERE c.id = :contestId AND c.hidden = false")
    Optional<Contest> findByIdAndHiddenFalse(@Param("contestId") String contestId);

    // Find visible contest (not hidden)
    @Query("SELECT c FROM Contest c WHERE c.hidden = false ORDER BY c.startTime DESC")
    Page<Contest> findAllVisibleContests(Pageable pageable);

    // Find active contests (visible and ongoing)
    @Query("SELECT c FROM Contest c WHERE c.hidden = false AND c.startTime <= :now AND c.endTime > :now ORDER BY c.endTime ASC")
    List<Contest> findActiveContests(@Param("now") LocalDateTime now);

    // Find upcoming contests (visible and not started)
    @Query("SELECT c FROM Contest c WHERE c.hidden = false AND c.startTime > :now ORDER BY c.startTime ASC")
    List<Contest> findUpcomingContests(@Param("now") LocalDateTime now);

    // Find past contests (visible and ended)
    @Query("SELECT c FROM Contest c WHERE c.hidden = false AND c.endTime <= :now ORDER BY c.endTime DESC")
    Page<Contest> findPastContests(@Param("now") LocalDateTime now, Pageable pageable);

    // Search contests by title
    @Query("SELECT c FROM Contest c WHERE c.hidden = false AND LOWER(c.title) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY c.startTime DESC")
    Page<Contest> searchContests(@Param("query") String query, Pageable pageable);
}
