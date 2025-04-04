package com.hust.hustforces.service.impl;

import com.hust.hustforces.exception.ResourceNotFoundException;
import com.hust.hustforces.model.dto.discussion.CommentDto;
import com.hust.hustforces.model.dto.discussion.DiscussionDetailDto;
import com.hust.hustforces.model.dto.discussion.DiscussionDto;
import com.hust.hustforces.model.dto.discussion.UserSummaryDto;
import com.hust.hustforces.model.entity.Discussion;
import com.hust.hustforces.model.entity.Problem;
import com.hust.hustforces.model.entity.User;
import com.hust.hustforces.repository.CommentRepository;
import com.hust.hustforces.repository.DiscussionRepository;
import com.hust.hustforces.repository.ProblemRepository;
import com.hust.hustforces.repository.UserRepository;
import com.hust.hustforces.service.CommentService;
import com.hust.hustforces.service.DiscussionService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DiscussionServiceImpl implements DiscussionService {
    private final DiscussionRepository discussionRepository;
    private final ProblemRepository problemRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final CommentService commentService;

    @Override
    @Transactional
    public DiscussionDto createDiscussion(String title, String content, String userId, String problemId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Problem problem = null;
        if (problemId != null) {
            problem = problemRepository.findById(problemId)
                    .orElseThrow(() -> new ResourceNotFoundException("Problem", "id", problemId));
        }

        Discussion discussion = Discussion.builder()
                .title(title)
                .content(content)
                .userId(userId)
                .problemId(problemId)
                .build();

        Discussion savedDiscussion = discussionRepository.save(discussion);

        return mapToDiscussionDto(savedDiscussion, user, problem, 0);
    }

    @Override
    @Transactional
    public DiscussionDetailDto getDiscussion(String id, String userId) {
        Discussion discussion = discussionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Discussion", "id", id));

        // Increment view count
        discussion.setViewCount(discussion.getViewCount() + 1);
        discussionRepository.save(discussion);

        User user = userRepository.findById(discussion.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", discussion.getUserId()));

        Problem problem = null;
        if (discussion.getProblemId() != null) {
            problem = problemRepository.findById(discussion.getProblemId())
                    .orElse(null);
        }

        List<CommentDto> comments = commentService.getDiscussionComments(id);

        return mapToDiscussionDetailDto(discussion, user, problem, comments);
    }

    @Override
    @Transactional
    public DiscussionDto updateDiscussion(String id, String title, String content, String userId) {
        Discussion discussion = discussionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Discussion", "id", id));

        if (!discussion.getUserId().equals(userId)) {
            throw new IllegalArgumentException("You can only update your own discussions");
        }

        discussion.setTitle(title);
        discussion.setContent(content);

        Discussion updatedDiscussion = discussionRepository.save(discussion);

        User user = userRepository.findById(updatedDiscussion.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", updatedDiscussion.getUserId()));

        Problem problem = null;
        if (updatedDiscussion.getProblemId() != null) {
            problem = problemRepository.findById(updatedDiscussion.getProblemId())
                    .orElse(null);
        }

        int commentCount = commentRepository.countByDiscussionId(id);

        return mapToDiscussionDto(updatedDiscussion, user, problem, commentCount);
    }

    @Override
    @Transactional
    public void deleteDiscussion(String id, String userId) {
        Discussion discussion = discussionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Discussion", "id", id));

        if (!discussion.getUserId().equals(userId)) {
            throw new IllegalArgumentException("You can only delete your own discussions");
        }

        discussionRepository.delete(discussion);
    }

    @Override
    public Page<DiscussionDto> getAllDiscussions(Pageable pageable) {
        Page<Discussion> discussions = discussionRepository.findAllByOrderByCreatedAtDesc(pageable);

        return discussions.map(discussion -> {
            User user = userRepository.findById(discussion.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", discussion.getUserId()));

            Problem problem = null;
            if (discussion.getProblemId() != null) {
                problem = problemRepository.findById(discussion.getProblemId())
                        .orElse(null);
            }

            int commentCount = commentRepository.countByDiscussionId(discussion.getId());

            return mapToDiscussionDto(discussion, user, problem, commentCount);
        });
    }

    @Override
    public Page<DiscussionDto> getDiscussionsByProblem(String problemId, Pageable pageable) {
        Page<Discussion> discussions = discussionRepository.findByProblemIdOrderByCreatedAtDesc(problemId, pageable);

        return discussions.map(discussion -> {
            User user = userRepository.findById(discussion.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", discussion.getUserId()));

            Problem problem = problemRepository.findById(problemId)
                    .orElseThrow(() -> new ResourceNotFoundException("Problem", "id", problemId));

            int commentCount = commentRepository.countByDiscussionId(discussion.getId());

            return mapToDiscussionDto(discussion, user, problem, commentCount);
        });
    }

    @Override
    public Page<DiscussionDto> getDiscussionsByUser(String userId, Pageable pageable) {
        Page<Discussion> discussions = discussionRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);

        return discussions.map(discussion -> {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

            Problem problem = null;
            if (discussion.getProblemId() != null) {
                problem = problemRepository.findById(discussion.getProblemId())
                        .orElse(null);
            }

            int commentCount = commentRepository.countByDiscussionId(discussion.getId());

            return mapToDiscussionDto(discussion, user, problem, commentCount);
        });
    }

    @Override
    public Page<DiscussionDto> searchDiscussions(String query, Pageable pageable) {
        Page<Discussion> discussions = discussionRepository.searchDiscussions(query, pageable);

        return discussions.map(discussion -> {
            User user = userRepository.findById(discussion.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", discussion.getUserId()));

            Problem problem = null;
            if (discussion.getProblemId() != null) {
                problem = problemRepository.findById(discussion.getProblemId())
                        .orElse(null);
            }

            int commentCount = commentRepository.countByDiscussionId(discussion.getId());

            return mapToDiscussionDto(discussion, user, problem, commentCount);
        });
    }

    @Override
    @Transactional
    public DiscussionDto voteDiscussion(String id, String userId, boolean isUpvote) {
        Discussion discussion = discussionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Discussion", "id", id));

        // In a real application, you would track user votes in a separate table
        // to prevent double voting. This is a simplified implementation.
        if (isUpvote) {
            discussion.setUpvotes(discussion.getUpvotes() + 1);
        } else {
            discussion.setDownvotes(discussion.getDownvotes() + 1);
        }

        Discussion updatedDiscussion = discussionRepository.save(discussion);

        User user = userRepository.findById(updatedDiscussion.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", updatedDiscussion.getUserId()));

        Problem problem = null;
        if (updatedDiscussion.getProblemId() != null) {
            problem = problemRepository.findById(updatedDiscussion.getProblemId())
                    .orElse(null);
        }

        int commentCount = commentRepository.countByDiscussionId(id);

        return mapToDiscussionDto(updatedDiscussion, user, problem, commentCount);
    }

    private DiscussionDto mapToDiscussionDto(Discussion discussion, User user, Problem problem, int commentCount) {
        return DiscussionDto.builder()
                .id(discussion.getId())
                .title(discussion.getTitle())
                .content(discussion.getContent())
                .user(mapToUserSummaryDto(user))
                .problemId(discussion.getProblemId())
                .problemTitle(problem != null ? problem.getTitle() : null)
                .createdAt(discussion.getCreatedAt())
                .updatedAt(discussion.getUpdatedAt())
                .commentCount(commentCount)
                .viewCount(discussion.getViewCount())
                .upvotes(discussion.getUpvotes())
                .downvotes(discussion.getDownvotes())
                .build();
    }

    private DiscussionDetailDto mapToDiscussionDetailDto(Discussion discussion, User user, Problem problem, List<CommentDto> comments) {
        return DiscussionDetailDto.builder()
                .id(discussion.getId())
                .title(discussion.getTitle())
                .content(discussion.getContent())
                .user(mapToUserSummaryDto(user))
                .problemId(discussion.getProblemId())
                .problemTitle(problem != null ? problem.getTitle() : null)
                .createdAt(discussion.getCreatedAt())
                .updatedAt(discussion.getUpdatedAt())
                .viewCount(discussion.getViewCount())
                .upvotes(discussion.getUpvotes())
                .downvotes(discussion.getDownvotes())
                .comments(comments)
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
