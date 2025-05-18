package com.hust.hustforces.model.dto.admin;

import com.hust.hustforces.enums.Difficulty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminProblemDetailDto {
    private String id;
    private String title;
    private String slug;
    private Difficulty difficulty;
    private boolean hidden;
    private String description;
    private String structure;
    private List<TestCaseInfo> testCases;
    private boolean boilerplateGenerated;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
