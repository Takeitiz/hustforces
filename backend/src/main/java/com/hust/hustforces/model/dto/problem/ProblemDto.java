package com.hust.hustforces.model.dto.problem;

import com.hust.hustforces.enums.Difficulty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProblemDto {
    private String id;
    private String title;
    private String slug;
    private Difficulty difficulty;
    private int solved;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int totalSubmissions;
    private double acceptanceRate;
}
