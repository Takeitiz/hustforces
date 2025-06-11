package com.hust.hustforces.controller;

import com.hust.hustforces.model.dto.coderoom.*;
import com.hust.hustforces.service.CodeRoomService;
import com.hust.hustforces.utils.CurrentUserUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/coderooms")
@RequiredArgsConstructor
@Slf4j
public class CodeRoomController {

    private final CodeRoomService codeRoomService;
    private final CurrentUserUtil currentUserUtil;

    @PostMapping
    public ResponseEntity<CodeRoomDto> createCodeRoom(@Valid @RequestBody CreateCodeRoomRequest request) {
        log.info("Creating new code room: {}", request.getName());
        String userId = currentUserUtil.getCurrentUserId();
        CodeRoomDto room = codeRoomService.createCodeRoom(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(room);
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<CodeRoomDetailDto> getCodeRoomDetails(@PathVariable String roomId) {
        String userId = currentUserUtil.getCurrentUserId();
        CodeRoomDetailDto details = codeRoomService.getCodeRoomDetails(roomId, userId);
        return ResponseEntity.ok(details);
    }

    @GetMapping("/code/{roomCode}")
    public ResponseEntity<CodeRoomDetailDto> getCodeRoomByCode(@PathVariable String roomCode) {
        String userId = currentUserUtil.getCurrentUserId();
        CodeRoomDetailDto details = codeRoomService.getCodeRoomByCode(roomCode, userId);
        return ResponseEntity.ok(details);
    }

    @PostMapping("/join")
    public ResponseEntity<ParticipantDto> joinCodeRoom(@Valid @RequestBody JoinCodeRoomRequest request) {
        String userId = currentUserUtil.getCurrentUserId();
        ParticipantDto participant = codeRoomService.joinCodeRoom(request.getRoomCode(), userId);
        return ResponseEntity.ok(participant);
    }

    @PostMapping("/{roomId}/leave")
    public ResponseEntity<Void> leaveCodeRoom(@PathVariable String roomId) {
        String userId = currentUserUtil.getCurrentUserId();
        codeRoomService.leaveCodeRoom(roomId, userId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{roomId}")
    public ResponseEntity<CodeRoomDto> updateCodeRoom(
            @PathVariable String roomId,
            @Valid @RequestBody UpdateCodeRoomRequest request) {
        String userId = currentUserUtil.getCurrentUserId();
        CodeRoomDto room = codeRoomService.updateCodeRoom(roomId, request, userId);
        return ResponseEntity.ok(room);
    }

    @DeleteMapping("/{roomId}")
    public ResponseEntity<Void> deleteCodeRoom(@PathVariable String roomId) {
        String userId = currentUserUtil.getCurrentUserId();
        codeRoomService.deleteCodeRoom(roomId, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{roomId}/participants")
    public ResponseEntity<List<ParticipantDto>> getActiveParticipants(@PathVariable String roomId) {
        List<ParticipantDto> participants = codeRoomService.getActiveParticipants(roomId);
        return ResponseEntity.ok(participants);
    }

    @PostMapping("/{roomId}/participants/{participantUserId}/kick")
    public ResponseEntity<Void> kickParticipant(
            @PathVariable String roomId,
            @PathVariable String participantUserId) {
        String userId = currentUserUtil.getCurrentUserId();
        codeRoomService.kickParticipant(roomId, participantUserId, userId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{roomId}/participants/{participantUserId}/role")
    public ResponseEntity<Void> updateParticipantRole(
            @PathVariable String roomId,
            @PathVariable String participantUserId,
            @RequestParam String role) {
        String userId = currentUserUtil.getCurrentUserId();
        codeRoomService.updateParticipantRole(roomId, participantUserId, role, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/public")
    public ResponseEntity<Page<CodeRoomDto>> getPublicRooms(
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        Page<CodeRoomDto> rooms = codeRoomService.getPublicRooms(pageable);
        return ResponseEntity.ok(rooms);
    }

    @GetMapping("/my-rooms")
    public ResponseEntity<List<CodeRoomDto>> getMyActiveRooms() {
        String userId = currentUserUtil.getCurrentUserId();
        List<CodeRoomDto> rooms = codeRoomService.getUserActiveRooms(userId);
        return ResponseEntity.ok(rooms);
    }

    @PostMapping("/{roomId}/end-session")
    public ResponseEntity<Void> endSession(@PathVariable String roomId) {
        String userId = currentUserUtil.getCurrentUserId();
        codeRoomService.endSession(roomId, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{roomId}/sessions")
    public ResponseEntity<List<SessionInfoDto>> getRoomSessions(@PathVariable String roomId) {
        List<SessionInfoDto> sessions = codeRoomService.getRoomSessions(roomId);
        return ResponseEntity.ok(sessions);
    }

    @GetMapping("/webrtc-config")
    public ResponseEntity<WebRTCConfigDto> getWebRTCConfig() {
        WebRTCConfigDto config = codeRoomService.getWebRTCConfig();
        return ResponseEntity.ok(config);
    }

    @GetMapping("/check-availability")
    public ResponseEntity<RoomAvailabilityDto> checkUserAvailability() {
        String userId = currentUserUtil.getCurrentUserId();
        boolean isInRoom = codeRoomService.isUserInRoom(userId);
        return ResponseEntity.ok(new RoomAvailabilityDto(!isInRoom));
    }
}