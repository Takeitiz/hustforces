package com.hust.hustforces.model.dto.coderoom;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionInfoDto {
    private String id;
    private LocalDateTime startedAt;
    private Integer durationMinutes;
    private Integer totalEdits;
    private Integer participantsCount;
}
