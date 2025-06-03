package com.hust.hustforces.model.dto.coderoom;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CursorUpdateEvent {
    private String userId;
    private CursorPositionDto position;
    private String colorHex;
}
