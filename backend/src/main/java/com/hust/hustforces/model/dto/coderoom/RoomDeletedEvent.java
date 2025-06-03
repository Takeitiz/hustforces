package com.hust.hustforces.model.dto.coderoom;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RoomDeletedEvent {
    private String roomId;
    private String message;
}
