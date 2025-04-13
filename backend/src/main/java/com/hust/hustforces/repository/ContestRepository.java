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

    /**
     * Find visible contests
     */
    Page<Contest> findByHiddenFalseOrderByStartTimeDesc(Pageable pageable);

    /**
     * Find a contest by ID that is not hidden
     */
    Optional<Contest> findByIdAndHiddenFalse(String contestId);

    /**
     * Find active contests
     */
    @Query("SELECT c FROM Contest c WHERE c.hidden = false AND c.startTime <= :now AND c.endTime > :now ORDER BY c.endTime ASC")
    List<Contest> findActiveContests(@Param("now") LocalDateTime now);

    /**
     * Find upcoming contests
     */
    @Query("SELECT c FROM Contest c WHERE c.hidden = false AND c.startTime > :now ORDER BY c.startTime ASC")
    List<Contest> findUpcomingContests(@Param("now") LocalDateTime now);

    /**
     * Find past contests
     */
    @Query("SELECT c FROM Contest c WHERE c.hidden = false AND c.endTime <= :now ORDER BY c.endTime DESC")
    Page<Contest> findPastContests(@Param("now") LocalDateTime now, Pageable pageable);

    /**
     * Search contests by title
     */
    @Query("SELECT c FROM Contest c WHERE c.hidden = false AND LOWER(c.title) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY c.startTime DESC")
    Page<Contest> searchContests(@Param("query") String query, Pageable pageable);
}
