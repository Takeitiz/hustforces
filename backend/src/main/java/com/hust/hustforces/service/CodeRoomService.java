package com.hust.hustforces.service;

import com.hust.hustforces.model.dto.coderoom.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CodeRoomService {
    // Room Management
    CodeRoomDto createCodeRoom(CreateCodeRoomRequest request, String hostUserId);

    CodeRoomDetailDto getCodeRoomDetails(String roomId, String userId);

    CodeRoomDetailDto getCodeRoomByCode(String roomCode, String userId);

    void deleteCodeRoom(String roomId, String userId);

    CodeRoomDto updateCodeRoom(String roomId, UpdateCodeRoomRequest request, String userId);

    // Participant Management
    ParticipantDto joinCodeRoom(String roomCode, String userId);

    void leaveCodeRoom(String roomId, String userId);

    void kickParticipant(String roomId, String participantUserId, String requestingUserId);

    void updateParticipantRole(String roomId, String participantUserId, String role, String requestingUserId);

    List<ParticipantDto> getActiveParticipants(String roomId);

    // Code Synchronization
    void updateCode(String roomId, CodeChangeDto change, String userId);

    String getCurrentCode(String roomId);

    void updateCursorPosition(String roomId, CursorPositionDto position, String userId);

    // Room Discovery
    Page<CodeRoomDto> getPublicRooms(Pageable pageable);

    List<CodeRoomDto> getRoomsByProblem(String problemId);

    List<CodeRoomDto> getUserActiveRooms(String userId);

    // Session Management
    void endSession(String roomId, String userId);

    SessionInfoDto getCurrentSession(String roomId);

    List<SessionInfoDto> getRoomSessions(String roomId);

    // Submission
    String submitCode(String roomId, String userId);

    // WebRTC Configuration
    WebRTCConfigDto getWebRTCConfig();

    // Room Status
    boolean isUserInRoom(String userId);

    boolean canUserJoinRoom(String roomId, String userId);

    void updateRoomActivity(String roomId);
}