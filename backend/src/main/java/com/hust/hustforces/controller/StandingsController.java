package com.hust.hustforces.controller;

import com.hust.hustforces.model.dto.standings.StandingFilter;
import com.hust.hustforces.model.dto.standings.StandingResponseDto;
import com.hust.hustforces.model.dto.standings.UserRankDetailsDto;
import com.hust.hustforces.service.StandingsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/standings")
@RequiredArgsConstructor
@Slf4j
public class StandingsController {

    private final StandingsService standingsService;

    @GetMapping
    public ResponseEntity<StandingResponseDto> getStandings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "all") String timeRange,
            @RequestParam(defaultValue = "overall") String category) {

        log.info("Getting standings - page: {}, size: {}, timeRange: {}, category: {}",
                page, size, timeRange, category);

        StandingFilter filter = StandingFilter.builder()
                .timeRange(timeRange)
                .category(category)
                .build();

        StandingResponseDto response = standingsService.getStandings(page, size, filter);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    public ResponseEntity<StandingResponseDto> searchUsers(
            @RequestParam String q,
            @RequestParam(defaultValue = "all") String timeRange,
            @RequestParam(defaultValue = "overall") String category) {

        log.info("Searching users - query: {}, timeRange: {}, category: {}",
                q, timeRange, category);

        StandingFilter filter = StandingFilter.builder()
                .timeRange(timeRange)
                .category(category)
                .build();

        StandingResponseDto response = standingsService.searchUsers(q, filter);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/{userId}/rank")
    public ResponseEntity<UserRankDetailsDto> getUserRank(@PathVariable String userId) {
        log.info("Getting rank details for user: {}", userId);

        UserRankDetailsDto rankDetails = standingsService.getUserRank(userId);
        return ResponseEntity.ok(rankDetails);
    }

    @GetMapping("/top")
    public ResponseEntity<StandingResponseDto> getTopPerformers(
            @RequestParam(defaultValue = "10") int limit) {

        log.info("Getting top {} performers", limit);

        StandingResponseDto response = standingsService.getTopPerformers(limit);
        return ResponseEntity.ok(response);
    }
}
