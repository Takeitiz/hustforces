package com.hust.hustforces.controller;

import com.hust.hustforces.model.dto.discussion.CreateDiscussionRequest;
import com.hust.hustforces.model.dto.discussion.DiscussionDetailDto;
import com.hust.hustforces.model.dto.discussion.DiscussionDto;
import com.hust.hustforces.model.dto.discussion.UpdateDiscussionRequest;
import com.hust.hustforces.service.DiscussionService;
import com.hust.hustforces.utils.CurrentUserUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/discussions")
@RequiredArgsConstructor
@Slf4j
public class DiscussionController {
    private final DiscussionService discussionService;
    private final CurrentUserUtil currentUserUtil;

    @PostMapping
    public ResponseEntity<DiscussionDto> createDiscussion(@Valid @RequestBody CreateDiscussionRequest request) {
        String userId = currentUserUtil.getCurrentUserId();

        DiscussionDto discussion = discussionService.createDiscussion(
                request.getTitle(),
                request.getContent(),
                userId,
                request.getProblemId()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(discussion);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DiscussionDetailDto> getDiscussion(@PathVariable String id) {
        String userId = currentUserUtil.getCurrentUserId();
        DiscussionDetailDto discussion = discussionService.getDiscussion(id, userId);
        return ResponseEntity.ok(discussion);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DiscussionDto> updateDiscussion(
            @PathVariable String id,
            @Valid @RequestBody UpdateDiscussionRequest request
    ) {
        String userId = currentUserUtil.getCurrentUserId();

        DiscussionDto discussion = discussionService.updateDiscussion(
                id,
                request.getTitle(),
                request.getContent(),
                userId
        );

        return ResponseEntity.ok(discussion);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDiscussion(@PathVariable String id) {
        String userId = currentUserUtil.getCurrentUserId();
        discussionService.deleteDiscussion(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<Page<DiscussionDto>> getAllDiscussions(
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable
    ) {
        Page<DiscussionDto> discussions = discussionService.getAllDiscussions(pageable);
        return ResponseEntity.ok(discussions);
    }

    @GetMapping("/problem/{problemId}")
    public ResponseEntity<Page<DiscussionDto>> getDiscussionsByProblem(
            @PathVariable String problemId,
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable
    ) {
        Page<DiscussionDto> discussions = discussionService.getDiscussionsByProblem(problemId, pageable);
        return ResponseEntity.ok(discussions);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<DiscussionDto>> getDiscussionsByUser(
            @PathVariable String userId,
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable
    ) {
        Page<DiscussionDto> discussions = discussionService.getDiscussionsByUser(userId, pageable);
        return ResponseEntity.ok(discussions);
    }

    @GetMapping("/search")
    public ResponseEntity<Page<DiscussionDto>> searchDiscussions(
            @RequestParam String query,
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable
    ) {
        Page<DiscussionDto> discussions = discussionService.searchDiscussions(query, pageable);
        return ResponseEntity.ok(discussions);
    }

    @PostMapping("/{id}/vote")
    public ResponseEntity<DiscussionDto> voteDiscussion(
            @PathVariable String id,
            @RequestParam boolean upvote
    ) {
        String userId = currentUserUtil.getCurrentUserId();
        DiscussionDto discussion = discussionService.voteDiscussion(id, userId, upvote);
        return ResponseEntity.ok(discussion);
    }
}
