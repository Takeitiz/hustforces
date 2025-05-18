package com.hust.hustforces.model.dto.admin;

import com.hust.hustforces.enums.Difficulty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminProblemResponseDto {
    private String id;
    private String title;
    private String slug;
    private Difficulty difficulty;
    private boolean hidden;
    private boolean hasDescription;
    private boolean hasStructure;
    private int testCaseCount;
    private boolean boilerplateGenerated;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
