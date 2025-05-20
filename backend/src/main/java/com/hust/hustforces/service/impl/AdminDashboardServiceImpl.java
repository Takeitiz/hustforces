package com.hust.hustforces.service.impl;

import com.hust.hustforces.model.dto.admin.dashboard.AdminDashboardProblemDto;
import com.hust.hustforces.model.dto.admin.dashboard.AdminDashboardStatsDto;
import com.hust.hustforces.model.dto.admin.dashboard.AdminDashboardUserDto;
import com.hust.hustforces.model.entity.Problem;
import com.hust.hustforces.model.entity.User;
import com.hust.hustforces.repository.ContestRepository;
import com.hust.hustforces.repository.ProblemRepository;
import com.hust.hustforces.repository.SolutionRepository;
import com.hust.hustforces.repository.UserRepository;
import com.hust.hustforces.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private final UserRepository userRepository;
    private final ProblemRepository problemRepository;
    private final ContestRepository contestRepository;
    private final SolutionRepository solutionRepository;

    @Override
    public AdminDashboardStatsDto getStats() {
        log.info("Gathering admin dashboard statistics");

        // Count statistics
        long userCount = userRepository.count();
        long problemCount = problemRepository.count();
        long contestCount = contestRepository.count();
        long solutionCount = solutionRepository.count();

        log.debug("Counts - Users: {}, Problems: {}, Contests: {}, Solutions: {}",
                userCount, problemCount, contestCount, solutionCount);

        // Get recent users (top 5 by creation date)
        List<User> recentUsers = userRepository.findAll(
                        PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt")))
                .getContent();

        // Get recent problems (top 5 by creation date)
        List<Problem> recentProblems = problemRepository.findAll(
                        PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt")))
                .getContent();

        // Build and return the DTO
        AdminDashboardStatsDto stats = AdminDashboardStatsDto.builder()
                .userCount((int) userCount)
                .problemCount((int) problemCount)
                .contestCount((int) contestCount)
                .solutionCount((int) solutionCount)
                .recentUsers(mapToUserDtos(recentUsers))
                .recentProblems(mapToProblemDtos(recentProblems))
                .build();

        return stats;
    }

    private List<AdminDashboardUserDto> mapToUserDtos(List<User> users) {
        DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE_TIME;

        return users.stream()
                .map(user -> AdminDashboardUserDto.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .role(user.getRole().toString())
                        .createdAt(user.getCreatedAt().format(formatter))
                        .build())
                .collect(Collectors.toList());
    }

    private List<AdminDashboardProblemDto> mapToProblemDtos(List<Problem> problems) {
        DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE_TIME;

        return problems.stream()
                .map(problem -> AdminDashboardProblemDto.builder()
                        .id(problem.getId())
                        .title(problem.getTitle())
                        .difficulty(problem.getDifficulty().toString())
                        .createdAt(problem.getCreatedAt().format(formatter))
                        .build())
                .collect(Collectors.toList());
    }
}