package com.hust.hustforces.service.impl;

import com.hust.hustforces.exception.ResourceNotFoundException;
import com.hust.hustforces.mapper.CommentMapper;
import com.hust.hustforces.model.dto.discussion.CommentDto;
import com.hust.hustforces.model.entity.Comment;
import com.hust.hustforces.model.entity.User;
import com.hust.hustforces.model.entity.Vote;
import com.hust.hustforces.repository.CommentRepository;
import com.hust.hustforces.repository.DiscussionRepository;
import com.hust.hustforces.repository.SolutionRepository;
import com.hust.hustforces.repository.UserRepository;
import com.hust.hustforces.repository.VoteRepository;
import com.hust.hustforces.service.CommentService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentServiceImpl implements CommentService {
    private final CommentRepository commentRepository;
    private final DiscussionRepository discussionRepository;
    private final SolutionRepository solutionRepository;
    private final UserRepository userRepository;
    private final VoteRepository voteRepository;
    private final VoteCacheService voteCacheService;
    private final CommentMapper commentMapper;

    @Override
    @Transactional
    public CommentDto createComment(String content, String userId, String discussionId, String solutionId, String parentId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Comment comment = Comment.builder()
                .content(content)
                .userId(userId)
                .build();

        if (discussionId != null) {
            discussionRepository.findById(discussionId)
                    .orElseThrow(() -> new ResourceNotFoundException("Discussion", "id", discussionId));
            comment.setDiscussionId(discussionId);
        } else if (solutionId != null) {
            solutionRepository.findById(solutionId)
                    .orElseThrow(() -> new ResourceNotFoundException("Solution", "id", solutionId));
            comment.setSolutionId(solutionId);
        }

        if (parentId != null) {
            // Set up materialized path for the new comment
            Comment parentComment = commentRepository.findById(parentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", parentId));
            comment.setParentId(parentId);

            // Set materialized path based on parent
            comment.setPath(parentComment.getPath() + parentId + "/");
            comment.setLevel(parentComment.getLevel() + 1);

            // Update parent's reply count atomically
            commentRepository.incrementReplyCount(parentId);
        } else {
            // This is a root comment
            comment.setPath("/");
            comment.setLevel(0);
        }

        Comment savedComment = commentRepository.save(comment);

        return commentMapper.toCommentDto(savedComment, user, Collections.emptyList());
    }

    @Override
    @Transactional
    public CommentDto updateComment(String id, String content, String userId) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", id));

        if (!comment.getUserId().equals(userId)) {
            throw new IllegalArgumentException("You can only update your own comments");
        }

        comment.setContent(content);
        Comment updatedComment = commentRepository.save(comment);

        User user = userRepository.findById(updatedComment.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", updatedComment.getUserId()));

        return commentMapper.toCommentDto(updatedComment, user, Collections.emptyList());
    }

    @Override
    @Transactional
    public void deleteComment(String id, String userId) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", id));

        if (!comment.getUserId().equals(userId)) {
            throw new IllegalArgumentException("You can only delete your own comments");
        }

        // Update parent comment's reply count atomically if applicable
        if (comment.getParentId() != null) {
            commentRepository.decrementReplyCount(comment.getParentId());
        }

        commentRepository.delete(comment);
    }

    @Override
    public Page<CommentDto> getDiscussionComments(String discussionId, Pageable pageable) {
        Page<Comment> rootComments = commentRepository.findByDiscussionIdAndParentIdIsNullOrderByCreatedAtDesc(
                discussionId, pageable);

        return rootComments.map(this::mapCommentToDto);
    }

    @Override
    public Page<CommentDto> getSolutionComments(String solutionId, Pageable pageable) {
        Page<Comment> rootComments = commentRepository.findBySolutionIdAndParentIdIsNullOrderByCreatedAtDesc(
                solutionId, pageable);

        return rootComments.map(this::mapCommentToDto);
    }

    @Override
    public Page<CommentDto> getCommentReplies(String commentId, Pageable pageable) {
        Comment parentComment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", commentId));

        // Use materialized path to efficiently query child comments
        String pathPattern = parentComment.getPath() + parentComment.getId() + "/%";
        Page<Comment> replies = commentRepository.findRepliesByPathPattern(pathPattern, pageable);

        return replies.map(this::mapCommentToDto);
    }

    @Override
    @Transactional
    public CommentDto voteComment(String id, String userId, boolean isUpvote) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", id));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Check if the user has already voted
        Optional<Vote> existingVote = voteRepository.findByUserIdAndEntityIdAndEntityType(
                userId, id, "COMMENT");

        if (existingVote.isPresent()) {
            Vote vote = existingVote.get();

            if (vote.isUpvote() == isUpvote) {
                // User is trying to vote the same way again, remove the vote
                voteRepository.delete(vote);

                if (isUpvote) {
                    // Use atomic update for upvotes
                    commentRepository.updateUpvotes(id, -1);
                    voteCacheService.updateVoteCache(id, "COMMENT", true, -1);
                } else {
                    // Use atomic update for downvotes
                    commentRepository.updateDownvotes(id, -1);
                    voteCacheService.updateVoteCache(id, "COMMENT", false, -1);
                }

            } else {
                // User is changing their vote
                vote.setUpvote(isUpvote);
                voteRepository.save(vote);

                if (isUpvote) {
                    // Atomic updates for both counts
                    commentRepository.updateUpvotes(id, 1);
                    commentRepository.updateDownvotes(id, -1);
                    voteCacheService.updateVoteCache(id, "COMMENT", true, 1);
                    voteCacheService.updateVoteCache(id, "COMMENT", false, -1);
                } else {
                    // Atomic updates for both counts
                    commentRepository.updateDownvotes(id, 1);
                    commentRepository.updateUpvotes(id, -1);
                    voteCacheService.updateVoteCache(id, "COMMENT", false, 1);
                    voteCacheService.updateVoteCache(id, "COMMENT", true, -1);
                }

            }
        } else {
            // New vote
            Vote vote = Vote.builder()
                    .userId(userId)
                    .entityId(id)
                    .entityType("COMMENT")
                    .isUpvote(isUpvote)
                    .build();
            voteRepository.save(vote);

            if (isUpvote) {
                commentRepository.updateUpvotes(id, 1);
                voteCacheService.updateVoteCache(id, "COMMENT", true, 1);
            } else {
                commentRepository.updateDownvotes(id, 1);
                voteCacheService.updateVoteCache(id, "COMMENT", false, 1);
            }

        }

        // If vote counts changed, invalidate cache to force refresh on next get
        voteCacheService.invalidateVoteCache(id, "COMMENT");


        // After all atomic updates, get the latest version of the comment
        Comment updatedComment = commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", id));

        return mapCommentToDto(updatedComment);
    }

    // Helper method to map Comment entity to DTO
    private CommentDto mapCommentToDto(Comment comment) {
        User user = userRepository.findById(comment.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", comment.getUserId()));

        // We don't eagerly load replies here - they'll be loaded with pagination when requested
        List<CommentDto> emptyReplies = Collections.emptyList();
        return commentMapper.toCommentDto(comment, user, emptyReplies);
    }
}