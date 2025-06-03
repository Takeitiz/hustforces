package com.hust.hustforces.service;

import com.hust.hustforces.model.dto.coderoom.CodeChangeDto;

public interface CodeRoomSyncService {
    void initializeRoom(String roomId, String initialCode);
    void applyChange(String roomId, CodeChangeDto change);
    String getCurrentCode(String roomId);
    void cleanupRoom(String roomId);
}
