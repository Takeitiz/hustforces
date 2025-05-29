package com.hust.hustforces.model.dto.coderoom;

import com.hust.hustforces.enums.CodeRoomStatus;
import com.hust.hustforces.enums.LanguageId;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeRoomDto {
    private String id;
    private String roomCode;
    private String name;
    private String description;
    private String problemId;
    private String problemTitle;
    private String contestId;
    private String contestTitle;
    private String hostUserId;
    private String hostUsername;
    private CodeRoomStatus status;
    private LanguageId languageId;
    private int maxParticipants;
    private int currentParticipants;
    private boolean isPublic;
    private boolean allowVoiceChat;
    private boolean allowVideoChat;
    private boolean allowScreenShare;
    private LocalDateTime createdAt;
    private LocalDateTime lastActivityAt;
}
