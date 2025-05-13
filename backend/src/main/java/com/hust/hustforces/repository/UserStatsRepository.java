package com.hust.hustforces.repository;

import com.hust.hustforces.model.entity.UserStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserStatsRepository extends JpaRepository<UserStats, String> {
    // Find stats that need updating (oldest first)
    List<UserStats> findTop50ByOrderByLastCalculatedAsc();

    // Find stats that have never been calculated
    @Query("SELECT us FROM UserStats us WHERE us.lastCalculated IS NULL")
    List<UserStats> findByLastCalculatedIsNull();
}
