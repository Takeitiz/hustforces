package com.hust.hustforces.model.dto.contest;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateContestRequest {

    @NotBlank(message = "Title cannot be blank")
    @Size(min = 3, max = 100, message = "Title must be between 3 and 100 characters")
    private String title;

    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;

    @NotNull(message = "Start time is required")
    @FutureOrPresent(message = "Start time must be in the future or present")
    private LocalDateTime startTime;

    @NotNull(message = "End time is required")
    @Future(message = "End time must be in the future")
    private LocalDateTime endTime;

    private boolean isHidden = false;

    private boolean leaderboard = true;

    @Valid
    @NotEmpty(message = "At least one problem must be added")
    @Size(min = 1, max = 20, message = "Contest must have between 1 and 20 problems")
    private List<ContestProblemDto> problems;

    @AssertTrue(message = "End time must be after start time")
    private boolean isValidTimeRange() {
        return endTime == null || startTime == null || endTime.isAfter(startTime);
    }

    @AssertTrue(message = "Contest duration must be at least 30 minutes")
    private boolean isValidDuration() {
        if (startTime == null || endTime == null) {
            return true;
        }
        return endTime.isAfter(startTime.plusMinutes(30));
    }

    @AssertTrue(message = "Contest duration cannot exceed 7 days")
    private boolean isNotTooLong() {
        if (startTime == null || endTime == null) {
            return true;
        }
        return endTime.isBefore(startTime.plusDays(7));
    }
}