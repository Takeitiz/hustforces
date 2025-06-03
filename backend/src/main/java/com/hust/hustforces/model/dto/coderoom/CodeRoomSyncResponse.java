package com.hust.hustforces.model.dto.coderoom;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CodeRoomSyncResponse {
    private String roomId;
    private String currentCode;
    private List<ParticipantDto> participants;
}
