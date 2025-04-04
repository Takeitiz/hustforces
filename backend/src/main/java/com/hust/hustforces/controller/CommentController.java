package com.hust.hustforces.controller;

import com.hust.hustforces.exception.ResourceNotFoundException;
import com.hust.hustforces.model.dto.discussion.CommentDto;
import com.hust.hustforces.model.entity.User;
import com.hust.hustforces.repository.UserRepository;
import com.hust.hustforces.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<CommentDto> createComment(@Valid @RequestBody Map<String, String> request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        String content = request.get("content");
        String discussionId = request.get("discussionId");
        String solutionId = request.get("solutionId");
        String parentId = request.get("parentId");

        CommentDto comment = commentService.createComment(
                content,
                user.getId(),
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
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        String content = request.get("content");

        CommentDto comment = commentService.updateComment(id, content, user.getId());
        return ResponseEntity.ok(comment);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable String id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        commentService.deleteComment(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/vote")
    public ResponseEntity<CommentDto> voteComment(
            @PathVariable String id,
            @RequestParam boolean upvote
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        CommentDto comment = commentService.voteComment(id, user.getId(), upvote);
        return ResponseEntity.ok(comment);
    }
}