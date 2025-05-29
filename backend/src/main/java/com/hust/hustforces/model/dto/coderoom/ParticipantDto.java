package com.hust.hustforces.model.dto.coderoom;

import com.hust.hustforces.enums.ParticipantRole;
import com.hust.hustforces.enums.ParticipantStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParticipantDto {
    private String id;
    private String userId;
    private String username;
    private String profilePicture;
    private ParticipantRole role;
    private ParticipantStatus status;
    private LocalDateTime joinedAt;
    private String colorHex;
    private boolean isTyping;
    private boolean isMuted;
    private boolean isVideoOn;
    private boolean isScreenSharing;
    private CursorPositionDto cursorPosition;
}
