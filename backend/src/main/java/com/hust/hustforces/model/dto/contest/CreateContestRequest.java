package com.hust.hustforces.model.dto.contest;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateContestRequest {
    @NotBlank(message = "Title cannot be blank")
    private String title;

    private String description;

    @NotNull(message = "Start time is required")
    @FutureOrPresent(message = "Start time must be in the future or present")
    private LocalDateTime startTime;

    @NotNull(message = "End time is required")
    @FutureOrPresent(message = "End time must be in the future or present")
    private LocalDateTime endTime;

    private boolean isHidden = true;

    private boolean leaderboard = true;

    @NotEmpty(message = "At least one problem must be added")
    private List<ContestProblemDto> problems;
}
