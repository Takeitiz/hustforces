package com.hust.hustforces.repository;

import com.hust.hustforces.model.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, String> {
    List<Comment> findByDiscussionIdAndParentIdIsNullOrderByCreatedAtAsc(String discussionId);

    List<Comment> findBySolutionIdAndParentIdIsNullOrderByCreatedAtAsc(String solutionId);

    List<Comment> findByParentIdOrderByCreatedAtAsc(String parentId);

    @Query("SELECT COUNT(c) FROM Comment c WHERE c.discussionId = :discussionId")
    int countByDiscussionId(@Param("discussionId") String discussionId);

    @Query("SELECT COUNT(c) FROM Comment c WHERE c.solutionId = :solutionId")
    int countBySolutionId(@Param("solutionId") String solutionId);
}
