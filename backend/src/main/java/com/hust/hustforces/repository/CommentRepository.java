package com.hust.hustforces.repository;

import com.hust.hustforces.model.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommentRepository extends JpaRepository<Comment, String> {
    // Paginated root-level comments
    Page<Comment> findByDiscussionIdAndParentIdIsNullOrderByCreatedAtDesc(String discussionId, Pageable pageable);

    Page<Comment> findBySolutionIdAndParentIdIsNullOrderByCreatedAtDesc(String solutionId, Pageable pageable);

    // Find replies using materialized path with pagination
    @Query("SELECT c FROM Comment c WHERE c.path LIKE :pathPattern ORDER BY c.createdAt")
    Page<Comment> findRepliesByPathPattern(@Param("pathPattern") String pathPattern, Pageable pageable);

    // Batch load direct replies for multiple comments
    @Query("SELECT c FROM Comment c WHERE c.parentId IN :parentIds ORDER BY c.parentId, c.createdAt")
    List<Comment> findByParentIdInOrderByParentIdCreatedAt(@Param("parentIds") List<String> parentIds);

    @Query("SELECT COUNT(c) FROM Comment c WHERE c.discussionId = :discussionId")
    int countByDiscussionId(@Param("discussionId") String discussionId);

    @Query("SELECT COUNT(c) FROM Comment c WHERE c.solutionId = :solutionId")
    int countBySolutionId(@Param("solutionId") String solutionId);

    // Database atomic update to prevent race condition in reply count
    @Modifying
    @Query("UPDATE Comment c SET c.replyCount = c.replyCount + 1 WHERE c.id = :commentId")
    void incrementReplyCount(@Param("commentId") String commentId);

    @Modifying
    @Query("UPDATE Comment c SET c.replyCount = GREATEST(0, c.replyCount - 1) WHERE c.id = :commentId")
    void decrementReplyCount(@Param("commentId") String commentId);

    @Modifying
    @Query("UPDATE Comment c SET c.upvotes = c.upvotes + :delta WHERE c.id = :commentId")
    void updateUpvotes(@Param("commentId") String commentId, @Param("delta") int delta);

    @Modifying
    @Query("UPDATE Comment c SET c.downvotes = c.downvotes + :delta WHERE c.id = :commentId")
    void updateDownvotes(@Param("commentId") String commentId, @Param("delta") int delta);

}
