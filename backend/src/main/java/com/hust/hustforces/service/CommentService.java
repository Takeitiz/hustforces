package com.hust.hustforces.service;

import com.hust.hustforces.model.dto.discussion.CommentDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CommentService {
    CommentDto createComment(String content, String userId, String discussionId, String solutionId, String parentId);

    CommentDto updateComment(String id, String content, String userId);

    void deleteComment(String id, String userId);

    Page<CommentDto> getDiscussionComments(String discussionId, Pageable pageable);

    Page<CommentDto> getSolutionComments(String solutionId, Pageable pageable);

    Page<CommentDto> getCommentReplies(String commentId, Pageable pageable);

    CommentDto voteComment(String id, String userId, boolean isUpvote);
}