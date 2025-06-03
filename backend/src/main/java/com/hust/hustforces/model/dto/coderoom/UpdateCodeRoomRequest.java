package com.hust.hustforces.model.dto.coderoom;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCodeRoomRequest {
    private String name;
    private String description;
    private Integer maxParticipants;
    private Boolean isPublic;
    private Boolean allowVoiceChat;
    private Boolean allowVideoChat;
    private Boolean allowScreenShare;
}
