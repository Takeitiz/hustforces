package com.hust.hustforces.model.dto.admin.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardStatsDto {
    private int userCount;
    private int problemCount;
    private int contestCount;
    private int solutionCount;
    private List<AdminDashboardUserDto> recentUsers;
    private List<AdminDashboardProblemDto> recentProblems;
}
