package com.hust.hustforces.repository;

import com.hust.hustforces.model.entity.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VoteRepository extends JpaRepository<Vote, String> {
    Optional<Vote> findByUserIdAndEntityIdAndEntityType(String userId, String entityId, String entityType);

    int countByEntityIdAndEntityTypeAndIsUpvote(String entityId, String entityType, boolean isUpvote);

    void deleteByUserIdAndEntityIdAndEntityType(String userId, String entityId, String entityType);
}
