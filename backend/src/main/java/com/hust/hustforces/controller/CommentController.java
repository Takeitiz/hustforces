package com.hust.hustforces.controller;

import com.hust.hustforces.exception.ResourceNotFoundException;
import com.hust.hustforces.model.dto.discussion.CommentDto;
import com.hust.hustforces.model.entity.User;
import com.hust.hustforces.repository.UserRepository;
import com.hust.hustforces.service.CommentService;
import com.hust.hustforces.utils.CurrentUserUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
@Slf4j
public class CommentController {
    private final CommentService commentService;
    private final CurrentUserUtil currentUserUtil;

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
    public ResponseEntity<List<CommentDto>> getDiscussionComments(@PathVariable String discussionId) {
        List<CommentDto> comments = commentService.getDiscussionComments(discussionId);
        return ResponseEntity.ok(comments);
    }

    @GetMapping("/solution/{solutionId}")
    public ResponseEntity<List<CommentDto>> getSolutionComments(@PathVariable String solutionId) {
        List<CommentDto> comments = commentService.getSolutionComments(solutionId);
        return ResponseEntity.ok(comments);
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
}