package com.hust.hustforces.controller;

import com.hust.hustforces.model.dto.admin.dashboard.AdminDashboardStatsDto;
import com.hust.hustforces.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Slf4j
public class AdminDashboardController {

    private final AdminDashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<AdminDashboardStatsDto> getStats() {
        log.info("Fetching admin dashboard statistics");
        AdminDashboardStatsDto stats = dashboardService.getStats();
        return ResponseEntity.ok(stats);
    }
}