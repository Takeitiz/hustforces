package com.hust.hustforces.service.impl;

import com.hust.hustforces.exception.ResourceNotFoundException;
import com.hust.hustforces.model.dto.discussion.CommentDto;
import com.hust.hustforces.model.dto.discussion.UserSummaryDto;
import com.hust.hustforces.model.entity.Comment;
import com.hust.hustforces.model.entity.Discussion;
import com.hust.hustforces.model.entity.Solution;
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
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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
            Discussion discussion = discussionRepository.findById(discussionId)
                    .orElseThrow(() -> new ResourceNotFoundException("Discussion", "id", discussionId));
            comment.setDiscussionId(discussionId);
        } else if (solutionId != null) {
            Solution solution = solutionRepository.findById(solutionId)
                    .orElseThrow(() -> new ResourceNotFoundException("Solution", "id", solutionId));
            comment.setSolutionId(solutionId);
        }

        if (parentId != null) {
            Comment parentComment = commentRepository.findById(parentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", parentId));
            comment.setParentId(parentId);
        }

        Comment savedComment = commentRepository.save(comment);
        return mapToCommentDto(savedComment, user, new ArrayList<>());
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

        return mapToCommentDto(updatedComment, user, new ArrayList<>());
    }

    @Override
    @Transactional
    public void deleteComment(String id, String userId) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", id));

        if (!comment.getUserId().equals(userId)) {
            throw new IllegalArgumentException("You can only delete your own comments");
        }

        commentRepository.delete(comment);
    }

    @Override
    public List<CommentDto> getDiscussionComments(String discussionId) {
        List<Comment> rootComments = commentRepository.findByDiscussionIdAndParentIdIsNullOrderByCreatedAtAsc(discussionId);
        return buildCommentTree(rootComments);
    }

    @Override
    public List<CommentDto> getSolutionComments(String solutionId) {
        List<Comment> rootComments = commentRepository.findBySolutionIdAndParentIdIsNullOrderByCreatedAtAsc(solutionId);
        return buildCommentTree(rootComments);
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
                    comment.setUpvotes(Math.max(0, comment.getUpvotes() - 1));
                } else {
                    comment.setDownvotes(Math.max(0, comment.getDownvotes() - 1));
                }
            } else {
                // User is changing their vote
                vote.setUpvote(isUpvote);
                voteRepository.save(vote);

                if (isUpvote) {
                    comment.setUpvotes(comment.getUpvotes() + 1);
                    comment.setDownvotes(Math.max(0, comment.getDownvotes() - 1));
                } else {
                    comment.setDownvotes(comment.getDownvotes() + 1);
                    comment.setUpvotes(Math.max(0, comment.getUpvotes() - 1));
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
                comment.setUpvotes(comment.getUpvotes() + 1);
            } else {
                comment.setDownvotes(comment.getDownvotes() + 1);
            }
        }

        Comment updatedComment = commentRepository.save(comment);
        List<Comment> replies = commentRepository.findByParentIdOrderByCreatedAtAsc(id);

        return mapToCommentDto(updatedComment, user, buildCommentTree(replies));
    }

    private List<CommentDto> buildCommentTree(List<Comment> comments) {
        List<CommentDto> result = new ArrayList<>();
        Map<String, List<Comment>> repliesMap = new HashMap<>();

        // Group all comments by parent ID
        for (Comment comment : comments) {
            String parentId = comment.getParentId();
            if (parentId != null) {
                if (!repliesMap.containsKey(parentId)) {
                    repliesMap.put(parentId, new ArrayList<>());
                }
                repliesMap.get(parentId).add(comment);
            }
        }

        // Process each root comment
        for (Comment comment : comments) {
            if (comment.getParentId() == null) {
                User user = userRepository.findById(comment.getUserId())
                        .orElseThrow(() -> new ResourceNotFoundException("User", "id", comment.getUserId()));

                List<Comment> replies = repliesMap.getOrDefault(comment.getId(), new ArrayList<>());
                List<CommentDto> replyDtos = replies.stream()
                        .map(reply -> {
                            User replyUser = userRepository.findById(reply.getUserId())
                                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", reply.getUserId()));
                            return mapToCommentDto(reply, replyUser, buildCommentTree(
                                    repliesMap.getOrDefault(reply.getId(), new ArrayList<>())));
                        })
                        .collect(Collectors.toList());

                result.add(mapToCommentDto(comment, user, replyDtos));
            }
        }

        return result;
    }

    private CommentDto mapToCommentDto(Comment comment, User user, List<CommentDto> replies) {
        return CommentDto.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .user(mapToUserSummaryDto(user))
                .parentId(comment.getParentId())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .upvotes(comment.getUpvotes())
                .downvotes(comment.getDownvotes())
                .replies(replies)
                .build();
    }

    private UserSummaryDto mapToUserSummaryDto(User user) {
        return UserSummaryDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .profilePicture(null)
                .build();
    }
}