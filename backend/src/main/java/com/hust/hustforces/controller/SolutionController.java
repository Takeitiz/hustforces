package com.hust.hustforces.controller;

import com.hust.hustforces.enums.LanguageId;
import com.hust.hustforces.exception.ResourceNotFoundException;
import com.hust.hustforces.model.dto.discussion.SolutionDetailDto;
import com.hust.hustforces.model.dto.discussion.SolutionDto;
import com.hust.hustforces.model.entity.User;
import com.hust.hustforces.repository.UserRepository;
import com.hust.hustforces.service.SolutionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/solutions")
@RequiredArgsConstructor
@Slf4j
public class SolutionController {
    private final SolutionService solutionService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<SolutionDto> createSolution(@Valid @RequestBody Map<String, String> request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        String code = request.get("code");
        String description = request.get("description");
        String problemId = request.get("problemId");
        LanguageId languageId = LanguageId.valueOf(request.get("languageId"));

        SolutionDto solution = solutionService.createSolution(
                code,
                description,
                user.getId(),
                problemId,
                languageId
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(solution);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SolutionDetailDto> getSolution(@PathVariable String id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        SolutionDetailDto solution = solutionService.getSolution(id, user.getId());
        return ResponseEntity.ok(solution);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SolutionDto> updateSolution(
            @PathVariable String id,
            @Valid @RequestBody Map<String, String> request
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        String code = request.get("code");
        String description = request.get("description");

        SolutionDto solution = solutionService.updateSolution(
                id,
                code,
                description,
                user.getId()
        );

        return ResponseEntity.ok(solution);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSolution(@PathVariable String id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        solutionService.deleteSolution(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<Page<SolutionDto>> getAllSolutions(
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable
    ) {
        Page<SolutionDto> solutions = solutionService.getAllSolutions(pageable);
        return ResponseEntity.ok(solutions);
    }

    @GetMapping("/problem/{problemId}")
    public ResponseEntity<Page<SolutionDto>> getSolutionsByProblem(
            @PathVariable String problemId,
            @PageableDefault(size = 10, sort = "upvotes") Pageable pageable
    ) {
        Page<SolutionDto> solutions = solutionService.getSolutionsByProblem(problemId, pageable);
        return ResponseEntity.ok(solutions);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<SolutionDto>> getSolutionsByUser(
            @PathVariable String userId,
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable
    ) {
        Page<SolutionDto> solutions = solutionService.getSolutionsByUser(userId, pageable);
        return ResponseEntity.ok(solutions);
    }

    @PostMapping("/{id}/vote")
    public ResponseEntity<SolutionDto> voteSolution(
            @PathVariable String id,
            @RequestParam boolean upvote
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        SolutionDto solution = solutionService.voteSolution(id, user.getId(), upvote);
        return ResponseEntity.ok(solution);
    }
}