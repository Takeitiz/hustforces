package com.hust.hustforces.service;

import com.hust.hustforces.model.dto.discussion.CommentDto;

import java.util.List;

public interface CommentService {
    CommentDto createComment(String content, String userId, String discussionId, String solutionId, String parentId);

    CommentDto updateComment(String id, String content, String userId);

    void deleteComment(String id, String userId);

    List<CommentDto> getDiscussionComments(String discussionId);

    List<CommentDto> getSolutionComments(String solutionId);

    CommentDto voteComment(String id, String userId, boolean isUpvote);
}