package com.hust.hustforces.model.dto.coderoom;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeRoomDetailDto {
    private CodeRoomDto room;
    private String currentCode;
    private List<ParticipantDto> participants;
    private SessionInfoDto currentSession;
    private WebRTCConfigDto webrtcConfig;
}

