package com.hust.hustforces.controller;

import com.hust.hustforces.model.dto.discussion.CommentDto;
import com.hust.hustforces.repository.CommentRepository;
import com.hust.hustforces.service.CommentService;
import com.hust.hustforces.utils.CurrentUserUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
@Slf4j
public class CommentController {
    private final CommentService commentService;
    private final CurrentUserUtil currentUserUtil;
    private final CommentRepository commentRepository;

    @PostMapping
    public ResponseEntity<CommentDto> createComment(@Valid @RequestBody Map<String, String> request) {
        String userId = currentUserUtil.getCurrentUserId();

        String content = request.get("content");
        String discussionId = request.get("discussionId");
        String solutionId = request.get("solutionId");
        String parentId = request.get("parentId");

        CommentDto comment = commentService.createComment(
                content,
                userId,
                discussionId,
                solutionId,
                parentId
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    @GetMapping("/discussion/{discussionId}")
    public ResponseEntity<Page<CommentDto>> getDiscussionComments(
            @PathVariable String discussionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort.Direction sortDirection = direction.equalsIgnoreCase("asc") ?
                Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));

        Page<CommentDto> comments = commentService.getDiscussionComments(discussionId, pageable);
        return ResponseEntity.ok(comments);
    }

    @GetMapping("/solution/{solutionId}")
    public ResponseEntity<Page<CommentDto>> getSolutionComments(
            @PathVariable String solutionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort.Direction sortDirection = direction.equalsIgnoreCase("asc") ?
                Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));

        Page<CommentDto> comments = commentService.getSolutionComments(solutionId, pageable);
        return ResponseEntity.ok(comments);
    }

    @GetMapping("/{commentId}/replies")
    public ResponseEntity<Page<CommentDto>> getCommentReplies(
            @PathVariable String commentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "asc") String direction) {

        Sort.Direction sortDirection = direction.equalsIgnoreCase("asc") ?
                Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));

        Page<CommentDto> replies = commentService.getCommentReplies(commentId, pageable);
        return ResponseEntity.ok(replies);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CommentDto> updateComment(
            @PathVariable String id,
            @Valid @RequestBody Map<String, String> request
    ) {
        String userId = currentUserUtil.getCurrentUserId();
        String content = request.get("content");

        CommentDto comment = commentService.updateComment(id, content, userId);
        return ResponseEntity.ok(comment);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable String id) {
        String userId = currentUserUtil.getCurrentUserId();
        commentService.deleteComment(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/vote")
    public ResponseEntity<CommentDto> voteComment(
            @PathVariable String id,
            @RequestParam boolean upvote
    ) {
        String userId = currentUserUtil.getCurrentUserId();
        CommentDto comment = commentService.voteComment(id, userId, upvote);
        return ResponseEntity.ok(comment);
    }

    @GetMapping("/{commentId}/vote")
    public ResponseEntity<?> getUserVote(@PathVariable String commentId) {
        try {
            String userId = currentUserUtil.getCurrentUserId();

            Optional<Comment> vote = commentRepository.findByUserIdAndCommentId(userId, commentId);

            if (vote.isPresent()) {
                return ResponseEntity.ok(Map.of("vote", vote.get().getVoteType()));
            } else {
                return ResponseEntity.ok(Map.of("vote", (Object) null));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Failed to fetch vote"));
        }
    }
}