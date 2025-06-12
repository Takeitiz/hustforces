package com.hust.hustforces.model.dto.standings;

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
public class StandingUserDto {
    private int rank;
    private String userId;
    private String username;
    private String profilePicture;
    private int problemsSolved;
    private int contestsAttended;
    private int totalSubmissions;
    private double acceptanceRate;
    private int rating;
    private List<UserBadgeDto> badges;
    private LocalDateTime lastActive;
}
