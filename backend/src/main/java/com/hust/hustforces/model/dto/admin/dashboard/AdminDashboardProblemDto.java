package com.hust.hustforces.model.dto.admin.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardProblemDto {
    private String id;
    private String title;
    private String difficulty;
    private String createdAt;
}
