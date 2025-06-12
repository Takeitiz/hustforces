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
public class StandingResponseDto {
    private List<StandingUserDto> users;
    private long totalUsers;
    private int page;
    private int pageSize;
    private LocalDateTime lastUpdated;
}
