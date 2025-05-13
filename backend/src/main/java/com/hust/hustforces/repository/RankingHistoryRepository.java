package com.hust.hustforces.repository;

import com.hust.hustforces.model.entity.RankingHistory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RankingHistoryRepository extends JpaRepository<RankingHistory, String> {
    @Query("SELECT r FROM RankingHistory r WHERE r.userId = :userId ORDER BY r.createdAt DESC")
    List<RankingHistory> findRecentByUserId(@Param("userId") String userId, Pageable pageable);
}
