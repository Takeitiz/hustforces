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
    private String description;
    private Difficulty difficulty;
    private int timeLimit;
    private int memoryLimit;
    private List<String> tags;
    private List<TestcaseDto> testcases;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String slug;
    private int submissionCount;
    private int acceptedCount;
    private boolean hidden;
}
