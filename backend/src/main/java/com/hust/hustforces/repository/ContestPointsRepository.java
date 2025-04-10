package com.hust.hustforces.repository;

import com.hust.hustforces.model.entity.ContestPoints;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContestPointsRepository extends JpaRepository<ContestPoints, String> {
    List<ContestPoints> findByContestIdOrderByRankAsc(String contestId);

    Optional<ContestPoints> findByContestIdAndUserId(String contestId, String userId);
}
