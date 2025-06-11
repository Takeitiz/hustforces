package com.hust.hustforces.service.impl;

import com.hust.hustforces.enums.CodeRoomStatus;
import com.hust.hustforces.enums.ParticipantRole;
import com.hust.hustforces.enums.ParticipantStatus;
import com.hust.hustforces.exception.ResourceNotFoundException;
import com.hust.hustforces.model.dto.SubmissionRequest;
import com.hust.hustforces.model.dto.coderoom.*;
import com.hust.hustforces.model.dto.submission.SubmissionDetailDto;
import com.hust.hustforces.model.entity.CodeRoom;
import com.hust.hustforces.model.entity.CodeRoomParticipant;
import com.hust.hustforces.model.entity.CodeRoomSession;
import com.hust.hustforces.model.entity.User;
import com.hust.hustforces.repository.*;
import com.hust.hustforces.service.CodeRoomService;
import com.hust.hustforces.service.CodeRoomSyncService;
import com.hust.hustforces.service.SubmissionService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CodeRoomServiceImpl implements CodeRoomService {

    private final CodeRoomRepository codeRoomRepository;
    private final CodeRoomParticipantRepository participantRepository;
    private final CodeRoomSessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final ProblemRepository problemRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final CodeRoomSyncService syncService;
    private final SubmissionService submissionService;

    @Value("${coderoom.stun.server:stun:stun.l.google.com:19302}")
    private String stunServer;

    @Value("${coderoom.turn.server:}")
    private String turnServer;

    @Value("${coderoom.turn.username:}")
    private String turnUsername;

    @Value("${coderoom.turn.credential:}")
    private String turnCredential;

    private static final String[] PARTICIPANT_COLORS = {
            "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A",
            "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2"
    };

    @Override
    public CodeRoomDto createCodeRoom(CreateCodeRoomRequest request, String hostUserId) {
        log.info("Creating code room for user: {}", hostUserId);

        // Generate unique room code
        String roomCode = generateRoomCode();

        // Create room entity
        CodeRoom room = CodeRoom.builder()
                .roomCode(roomCode)
                .name(request.getName())
                .description(request.getDescription())
                .problemId(request.getProblemId())
                .hostUserId(hostUserId)
                .status(CodeRoomStatus.ACTIVE)
                .languageId(request.getLanguageId())
                .currentCode(request.getInitialCode() != null ? request.getInitialCode() : "")
                .maxParticipants(request.getMaxParticipants())
                .isPublic(request.isPublic())
                .allowVoiceChat(request.isAllowVoiceChat())
                .allowVideoChat(request.isAllowVideoChat())
                .allowScreenShare(request.isAllowScreenShare())
                .lastActivityAt(LocalDateTime.now())
                .build();

        room = codeRoomRepository.save(room);

        // Add host as first participant
        CodeRoomParticipant hostParticipant = CodeRoomParticipant.builder()
                .codeRoomId(room.getId())
                .userId(hostUserId)
                .role(ParticipantRole.HOST)
                .status(ParticipantStatus.ACTIVE)
                .joinedAt(LocalDateTime.now())
                .lastActivityAt(LocalDateTime.now())
                .colorHex(PARTICIPANT_COLORS[0])
                .build();

        participantRepository.save(hostParticipant);

        // Create initial session
        CodeRoomSession session = CodeRoomSession.builder()
                .codeRoomId(room.getId())
                .startedAt(LocalDateTime.now())
                .participantsCount(1)
                .totalEdits(0)
                .build();

        sessionRepository.save(session);

        // Initialize sync service
        syncService.initializeRoom(room.getId(), request.getInitialCode() != null ? request.getInitialCode() : "");

        return convertToDto(room);
    }

    @Override
    public CodeRoomDetailDto getCodeRoomDetails(String roomId, String userId) {
        CodeRoom room = codeRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("CodeRoom", "id", roomId));

        // Check if user has access
        if (!canUserAccessRoom(room, userId)) {
            throw new IllegalArgumentException("User does not have access to this room");
        }

        CodeRoomDto roomDto = convertToDto(room);
        String currentCode = syncService.getCurrentCode(roomId);
        List<ParticipantDto> participants = getActiveParticipants(roomId);
        SessionInfoDto currentSession = getCurrentSession(roomId);
        WebRTCConfigDto webrtcConfig = getWebRTCConfig();

        return CodeRoomDetailDto.builder()
                .room(roomDto)
                .currentCode(currentCode)
                .participants(participants)
                .currentSession(currentSession)
                .webrtcConfig(webrtcConfig)
                .build();
    }

    @Override
    public CodeRoomDetailDto getCodeRoomByCode(String roomCode, String userId) {
        CodeRoom room = codeRoomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new ResourceNotFoundException("CodeRoom", "roomCode", roomCode));

        return getCodeRoomDetails(room.getId(), userId);
    }

    @Override
    public void deleteCodeRoom(String roomId, String userId) {
        log.info("User {} attempting to delete room {}", userId, roomId);

        CodeRoom room = codeRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("CodeRoom", "id", roomId));

        // Only host can delete the room
        if (!room.getHostUserId().equals(userId)) {
            throw new IllegalArgumentException("Only the room host can delete the room");
        }

        // Check if room is already closed
        if (room.getStatus() == CodeRoomStatus.COMPLETED || room.getStatus() == CodeRoomStatus.ABANDONED) {
            throw new IllegalStateException("Cannot delete a closed room");
        }

        // End any active sessions
        sessionRepository.findTopByCodeRoomIdAndEndedAtIsNullOrderByStartedAtDesc(roomId)
                .ifPresent(session -> {
                    session.setEndedAt(LocalDateTime.now());
                    session.setDurationMinutes(
                            (int) ChronoUnit.MINUTES.between(session.getStartedAt(), LocalDateTime.now())
                    );
                    session.setFinalCode(syncService.getCurrentCode(roomId));
                    sessionRepository.save(session);
                });

        // Notify all participants
        messagingTemplate.convertAndSend(
                "/topic/coderoom/" + roomId + "/status",
                new RoomDeletedEvent(roomId, "Room has been deleted by the host")
        );

        // Remove all active participants
        List<CodeRoomParticipant> participants =
                participantRepository.findByCodeRoomIdAndStatus(roomId, ParticipantStatus.ACTIVE);

        participants.forEach(p -> {
            p.setStatus(ParticipantStatus.LEFT);
            p.setLeftAt(LocalDateTime.now());
        });
        participantRepository.saveAll(participants);

        // Clean up sync data
        syncService.cleanupRoom(roomId);

        // Delete the room
        codeRoomRepository.delete(room);

        log.info("Room {} deleted successfully by user {}", roomId, userId);
    }

    @Override
    public CodeRoomDto updateCodeRoom(String roomId, UpdateCodeRoomRequest request, String userId) {
        log.info("User {} updating room {}", userId, roomId);

        CodeRoom room = codeRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("CodeRoom", "id", roomId));

        // Only host can update the room
        if (!room.getHostUserId().equals(userId)) {
            throw new IllegalArgumentException("Only the room host can update room settings");
        }

        // Check if room is active
        if (room.getStatus() != CodeRoomStatus.ACTIVE) {
            throw new IllegalStateException("Cannot update an inactive room");
        }

        // Update fields if provided
        if (request.getName() != null) {
            room.setName(request.getName());
        }

        if (request.getDescription() != null) {
            room.setDescription(request.getDescription());
        }

        if (request.getMaxParticipants() != null) {
            // Validate max participants
            int currentParticipants = participantRepository.countActiveParticipants(roomId);
            if (request.getMaxParticipants() < currentParticipants) {
                throw new IllegalArgumentException(
                        "Cannot set max participants lower than current participant count"
                );
            }
            room.setMaxParticipants(request.getMaxParticipants());
        }

        if (request.getIsPublic() != null) {
            room.setPublic(request.getIsPublic());
        }

        if (request.getAllowVoiceChat() != null) {
            room.setAllowVoiceChat(request.getAllowVoiceChat());
        }

        if (request.getAllowVideoChat() != null) {
            room.setAllowVideoChat(request.getAllowVideoChat());
        }

        if (request.getAllowScreenShare() != null) {
            room.setAllowScreenShare(request.getAllowScreenShare());
        }

        room.setLastActivityAt(LocalDateTime.now());
        room = codeRoomRepository.save(room);

        // Notify participants of room update
        CodeRoomDto roomDto = convertToDto(room);
        messagingTemplate.convertAndSend(
                "/topic/coderoom/" + roomId + "/settings",
                new RoomSettingsUpdatedEvent(roomDto)
        );

        log.info("Room {} updated successfully", roomId);
        return roomDto;
    }

    @Override
    public ParticipantDto joinCodeRoom(String roomCode, String userId) {
        log.info("User {} joining room with code: {}", userId, roomCode);

        CodeRoom room = codeRoomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new ResourceNotFoundException("CodeRoom", "roomCode", roomCode));

        // Check if room is active
        if (room.getStatus() != CodeRoomStatus.ACTIVE) {
            throw new IllegalStateException("Room is not active");
        }

        // Check if room is full
        int currentParticipants = participantRepository.countActiveParticipants(room.getId());
        if (currentParticipants >= room.getMaxParticipants()) {
            throw new IllegalStateException("Room is full");
        }

        // Check if user is already in the room
        Optional<CodeRoomParticipant> existingParticipant =
                participantRepository.findByCodeRoomIdAndUserId(room.getId(), userId);

        CodeRoomParticipant participant;
        if (existingParticipant.isPresent()) {
            // Rejoin
            participant = existingParticipant.get();
            participant.setStatus(ParticipantStatus.ACTIVE);
            participant.setJoinedAt(LocalDateTime.now());
            participant.setLastActivityAt(LocalDateTime.now());
        } else {
            // New participant
            String color = PARTICIPANT_COLORS[currentParticipants % PARTICIPANT_COLORS.length];

            participant = CodeRoomParticipant.builder()
                    .codeRoomId(room.getId())
                    .userId(userId)
                    .role(ParticipantRole.COLLABORATOR)
                    .status(ParticipantStatus.ACTIVE)
                    .joinedAt(LocalDateTime.now())
                    .lastActivityAt(LocalDateTime.now())
                    .colorHex(color)
                    .build();
        }

        participant = participantRepository.save(participant);

        // Update room activity
        room.setLastActivityAt(LocalDateTime.now());
        codeRoomRepository.save(room);

        // Update session participant count
        sessionRepository.findTopByCodeRoomIdAndEndedAtIsNullOrderByStartedAtDesc(room.getId())
                .ifPresent(session -> {
                    session.setParticipantsCount(currentParticipants + 1);
                    sessionRepository.save(session);
                });

        // Notify other participants
        ParticipantDto participantDto = convertToParticipantDto(participant);
        messagingTemplate.convertAndSend(
                "/topic/coderoom/" + room.getId() + "/participants",
                new ParticipantJoinedEvent(participantDto)
        );

        return participantDto;
    }

    @Override
    public void leaveCodeRoom(String roomId, String userId) {
        log.info("User {} leaving room: {}", userId, roomId);

        CodeRoomParticipant participant = participantRepository.findByCodeRoomIdAndUserId(roomId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Participant", "userId", userId));

        participant.setStatus(ParticipantStatus.LEFT);
        participant.setLeftAt(LocalDateTime.now());
        participantRepository.save(participant);

        // Notify other participants
        messagingTemplate.convertAndSend(
                "/topic/coderoom/" + roomId + "/participants",
                new ParticipantLeftEvent(userId)
        );

        // Check if room should be closed
        int activeParticipants = participantRepository.countActiveParticipants(roomId);
        if (activeParticipants == 0) {
            endSession(roomId, userId);
        }
    }

    @Override
    public void kickParticipant(String roomId, String participantUserId, String requestingUserId) {
        log.info("User {} attempting to kick {} from room {}",
                requestingUserId, participantUserId, roomId);

        CodeRoom room = codeRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("CodeRoom", "id", roomId));

        // Only host can kick participants
        if (!room.getHostUserId().equals(requestingUserId)) {
            throw new IllegalArgumentException("Only the room host can kick participants");
        }

        // Cannot kick yourself
        if (participantUserId.equals(requestingUserId)) {
            throw new IllegalArgumentException("Cannot kick yourself from the room");
        }

        CodeRoomParticipant participant = participantRepository
                .findByCodeRoomIdAndUserId(roomId, participantUserId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Participant", "userId", participantUserId
                ));

        // Check if participant is active
        if (participant.getStatus() != ParticipantStatus.ACTIVE) {
            throw new IllegalStateException("Participant is not active in the room");
        }

        // Remove participant
        participant.setStatus(ParticipantStatus.LEFT);
        participant.setLeftAt(LocalDateTime.now());
        participantRepository.save(participant);

        // Notify the kicked participant
        messagingTemplate.convertAndSendToUser(
                participantUserId,
                "/queue/coderoom/kicked",
                new ParticipantKickedEvent(roomId, "You have been removed from the room")
        );

        // Notify other participants
        messagingTemplate.convertAndSend(
                "/topic/coderoom/" + roomId + "/participants",
                new ParticipantLeftEvent(participantUserId)
        );

        log.info("Participant {} kicked from room {} by {}",
                participantUserId, roomId, requestingUserId);
    }

    @Override
    public void updateParticipantRole(String roomId, String participantUserId,
                                      String role, String requestingUserId) {
        log.info("User {} updating role of {} to {} in room {}",
                requestingUserId, participantUserId, role, roomId);

        CodeRoom room = codeRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("CodeRoom", "id", roomId));

        // Only host can update roles
        if (!room.getHostUserId().equals(requestingUserId)) {
            throw new IllegalArgumentException("Only the room host can update participant roles");
        }

        // Parse role
        ParticipantRole newRole;
        try {
            newRole = ParticipantRole.valueOf(role.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role: " + role);
        }

        // Cannot change host role
        if (newRole == ParticipantRole.HOST) {
            throw new IllegalArgumentException("Cannot assign HOST role directly. Use transfer ownership instead");
        }

        CodeRoomParticipant participant = participantRepository
                .findByCodeRoomIdAndUserId(roomId, participantUserId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Participant", "userId", participantUserId
                ));

        // Update role
        ParticipantRole oldRole = participant.getRole();
        participant.setRole(newRole);
        participantRepository.save(participant);

        // Notify all participants
        messagingTemplate.convertAndSend(
                "/topic/coderoom/" + roomId + "/participants",
                new ParticipantRoleChangedEvent(participantUserId, oldRole, newRole)
        );

        log.info("Participant {} role updated from {} to {} in room {}",
                participantUserId, oldRole, newRole, roomId);
    }

    @Override
    public List<ParticipantDto> getActiveParticipants(String roomId) {
        List<CodeRoomParticipant> participants =
                participantRepository.findByCodeRoomIdAndStatus(roomId, ParticipantStatus.ACTIVE);

        return participants.stream()
                .map(this::convertToParticipantDto)
                .collect(Collectors.toList());
    }

    @Override
    public void updateCode(String roomId, CodeChangeDto change, String userId) {
        // Verify user is in room and active
        CodeRoomParticipant participant = participantRepository.findByCodeRoomIdAndUserId(roomId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Participant", "userId", userId));

        if (participant.getStatus() != ParticipantStatus.ACTIVE) {
            throw new IllegalStateException("User is not active in the room");
        }

        // Update participant activity
        participant.setLastActivityAt(LocalDateTime.now());
        participantRepository.save(participant);

        // Apply change to sync service
        syncService.applyChange(roomId, change);

        // Update room activity
        codeRoomRepository.findById(roomId).ifPresent(room -> {
            room.setLastActivityAt(LocalDateTime.now());
            codeRoomRepository.save(room);
        });

        // Update session edit count
        sessionRepository.findTopByCodeRoomIdAndEndedAtIsNullOrderByStartedAtDesc(roomId)
                .ifPresent(session -> {
                    session.setTotalEdits(session.getTotalEdits() + 1);
                    sessionRepository.save(session);
                });

        // Broadcast change to other participants
        messagingTemplate.convertAndSend(
                "/topic/coderoom/" + roomId + "/code",
                change
        );
    }

    @Override
    public String getCurrentCode(String roomId) {
        return syncService.getCurrentCode(roomId);
    }

    @Override
    public void updateCursorPosition(String roomId, CursorPositionDto position, String userId) {
        // Update participant cursor position
        participantRepository.findByCodeRoomIdAndUserId(roomId, userId)
                .ifPresent(participant -> {
                    // For simplicity, we'll broadcast cursor positions without storing them
                    // In a production system, you might want to store these in Redis

                    CursorUpdateEvent event = CursorUpdateEvent.builder()
                            .userId(userId)
                            .position(position)
                            .colorHex(participant.getColorHex())
                            .build();

                    messagingTemplate.convertAndSend(
                            "/topic/coderoom/" + roomId + "/cursors",
                            event
                    );
                });
    }

    @Override
    public Page<CodeRoomDto> getPublicRooms(Pageable pageable) {
        return codeRoomRepository.findByStatusAndIsPublicOrderByCreatedAtDesc(
                        CodeRoomStatus.ACTIVE, true, pageable)
                .map(this::convertToDto);
    }

    @Override
    public List<CodeRoomDto> getRoomsByProblem(String problemId) {
        return codeRoomRepository.findActivePublicRoomsByProblemId(problemId)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<CodeRoomDto> getUserActiveRooms(String userId) {
        return participantRepository.findByUserIdAndStatus(userId, ParticipantStatus.ACTIVE)
                .stream()
                .map(p -> codeRoomRepository.findById(p.getCodeRoomId()).orElse(null))
                .filter(Objects::nonNull)
                .filter(room -> room.getStatus() == CodeRoomStatus.ACTIVE)
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public void endSession(String roomId, String userId) {
        CodeRoom room = codeRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("CodeRoom", "id", roomId));

        // Verify user is host
        if (!room.getHostUserId().equals(userId)) {
            throw new IllegalArgumentException("Only the host can end the session");
        }

        // End current session
        sessionRepository.findTopByCodeRoomIdAndEndedAtIsNullOrderByStartedAtDesc(roomId)
                .ifPresent(session -> {
                    session.setEndedAt(LocalDateTime.now());
                    session.setDurationMinutes(
                            (int) ChronoUnit.MINUTES.between(session.getStartedAt(), LocalDateTime.now())
                    );
                    session.setFinalCode(syncService.getCurrentCode(roomId));
                    sessionRepository.save(session);
                });

        // Update room status
        room.setStatus(CodeRoomStatus.COMPLETED);
        room.setClosedAt(LocalDateTime.now());
        codeRoomRepository.save(room);

        // Remove all participants
        List<CodeRoomParticipant> participants =
                participantRepository.findByCodeRoomIdAndStatus(roomId, ParticipantStatus.ACTIVE);

        participants.forEach(p -> {
            p.setStatus(ParticipantStatus.LEFT);
            p.setLeftAt(LocalDateTime.now());
        });

        participantRepository.saveAll(participants);

        // Clean up sync service
        syncService.cleanupRoom(roomId);

        // Notify all participants
        messagingTemplate.convertAndSend(
                "/topic/coderoom/" + roomId + "/status",
                new RoomClosedEvent(roomId)
        );
    }

    @Override
    public SessionInfoDto getCurrentSession(String roomId) {
        return sessionRepository.findTopByCodeRoomIdAndEndedAtIsNullOrderByStartedAtDesc(roomId)
                .map(session -> SessionInfoDto.builder()
                        .id(session.getId())
                        .startedAt(session.getStartedAt())
                        .durationMinutes((int) ChronoUnit.MINUTES.between(
                                session.getStartedAt(),
                                LocalDateTime.now()
                        ))
                        .totalEdits(session.getTotalEdits())
                        .participantsCount(session.getParticipantsCount())
                        .build())
                .orElse(null);
    }

    @Override
    public List<SessionInfoDto> getRoomSessions(String roomId) {
        log.info("Fetching sessions for room {}", roomId);

        // Verify room exists
        if (!codeRoomRepository.existsById(roomId)) {
            throw new ResourceNotFoundException("CodeRoom", "id", roomId);
        }

        List<CodeRoomSession> sessions = sessionRepository
                .findByCodeRoomIdOrderByStartedAtDesc(roomId);

        return sessions.stream()
                .map(session -> SessionInfoDto.builder()
                        .id(session.getId())
                        .startedAt(session.getStartedAt())
                        .durationMinutes(session.getDurationMinutes() != null ?
                                session.getDurationMinutes() :
                                (int) ChronoUnit.MINUTES.between(
                                        session.getStartedAt(),
                                        session.getEndedAt() != null ?
                                                session.getEndedAt() : LocalDateTime.now()
                                ))
                        .totalEdits(session.getTotalEdits())
                        .participantsCount(session.getParticipantsCount())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public String submitCode(String roomId, String userId) {
        log.info("User {} submitting code from room {}", userId, roomId);

        CodeRoom room = codeRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("CodeRoom", "id", roomId));

        // Verify user is in the room
        CodeRoomParticipant participant = participantRepository
                .findByCodeRoomIdAndUserId(roomId, userId)
                .orElseThrow(() -> new IllegalArgumentException("User is not in the room"));

        if (participant.getStatus() != ParticipantStatus.ACTIVE) {
            throw new IllegalStateException("User is not active in the room");
        }

        // Get current code from sync service
        String currentCode = syncService.getCurrentCode(roomId);

        if (currentCode == null || currentCode.trim().isEmpty()) {
            throw new IllegalStateException("No code to submit");
        }

        // Verify problem exists
        if (room.getProblemId() == null) {
            throw new IllegalStateException("Room is not associated with a problem");
        }

        // Create submission request
        SubmissionRequest submissionRequest = SubmissionRequest.builder()
                .code(currentCode)
                .languageId(room.getLanguageId())
                .problemId(room.getProblemId())
                .build();

        try {
            // Submit using existing submission service
            SubmissionDetailDto submission = submissionService.createSubmission(submissionRequest, userId);

            // Update session with submission ID
            sessionRepository.findTopByCodeRoomIdAndEndedAtIsNullOrderByStartedAtDesc(roomId)
                    .ifPresent(session -> {
                        session.setSubmissionId(submission.getId());
                        session.setFinalCode(currentCode);
                        sessionRepository.save(session);
                    });

            // Notify all participants
            messagingTemplate.convertAndSend(
                    "/topic/coderoom/" + roomId + "/submission",
                    new CodeSubmittedEvent(submission.getId(), userId)
            );

            log.info("Code submitted successfully. Submission ID: {}", submission.getId());
            return submission.getId();

        } catch (IOException e) {
            log.error("Error submitting code from room {}: {}", roomId, e.getMessage(), e);
            throw new RuntimeException("Failed to submit code", e);
        }
    }

    @Override
    public WebRTCConfigDto getWebRTCConfig() {
        List<String> iceServers = new ArrayList<>();
        iceServers.add(stunServer);

        if (!turnServer.isEmpty()) {
            iceServers.add(turnServer);
        }

        return WebRTCConfigDto.builder()
                .iceServers(iceServers)
                .stunServer(stunServer)
                .turnServer(turnServer)
                .turnUsername(turnUsername)
                .turnCredential(turnCredential)
                .build();
    }

    @Override
    public boolean isUserInRoom(String userId) {
        return !participantRepository.findByUserIdAndStatus(userId, ParticipantStatus.ACTIVE).isEmpty();
    }

    @Override
    public boolean canUserJoinRoom(String roomId, String userId) {
        CodeRoom room = codeRoomRepository.findById(roomId)
                .orElse(null);

        if (room == null) {
            return false;
        }

        // Check if room is active
        if (room.getStatus() != CodeRoomStatus.ACTIVE) {
            return false;
        }

        // Check if user is already in another active room
        List<CodeRoomParticipant> activeParticipations =
                participantRepository.findByUserIdAndStatus(userId, ParticipantStatus.ACTIVE);

        // User can only be in one active room at a time
        if (!activeParticipations.isEmpty() &&
                activeParticipations.stream().noneMatch(p -> p.getCodeRoomId().equals(roomId))) {
            return false;
        }

        // Check if room is full (unless user is already a participant)
        Optional<CodeRoomParticipant> existingParticipant =
                participantRepository.findByCodeRoomIdAndUserId(roomId, userId);

        if (existingParticipant.isEmpty()) {
            int currentParticipants = participantRepository.countActiveParticipants(roomId);
            if (currentParticipants >= room.getMaxParticipants()) {
                return false;
            }
        }

        // Check if room is private and user is not already a participant
        if (!room.isPublic() && existingParticipant.isEmpty()) {
            return false;
        }

        return true;
    }

    @Override
    public void updateRoomActivity(String roomId) {
        codeRoomRepository.findById(roomId).ifPresent(room -> {
            room.setLastActivityAt(LocalDateTime.now());
            codeRoomRepository.save(room);
        });
    }

    // Helper methods
    private String generateRoomCode() {
        String characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder code = new StringBuilder();
        Random random = new Random();

        do {
            code.setLength(0);
            for (int i = 0; i < 6; i++) {
                code.append(characters.charAt(random.nextInt(characters.length())));
            }
        } while (codeRoomRepository.existsByRoomCode(code.toString()));

        return code.toString();
    }

    private boolean canUserAccessRoom(CodeRoom room, String userId) {
        // Public rooms can be accessed by anyone
        if (room.isPublic()) {
            return true;
        }

        // Check if user is a participant
        return participantRepository.findByCodeRoomIdAndUserId(room.getId(), userId).isPresent();
    }

    private CodeRoomDto convertToDto(CodeRoom room) {
        String problemTitle = null;
        if (room.getProblemId() != null) {
            problemRepository.findById(room.getProblemId())
                    .ifPresent(room::setProblem);
            problemTitle = room.getProblem() != null ? room.getProblem().getTitle() : null;
        }

        String hostUsername = null;
        if (room.getHostUserId() != null) {
            userRepository.findById(room.getHostUserId())
                    .ifPresent(room::setHostUser);
            hostUsername = room.getHostUser() != null ? room.getHostUser().getUsername() : null;
        }

        int currentParticipants = participantRepository.countActiveParticipants(room.getId());

        return CodeRoomDto.builder()
                .id(room.getId())
                .roomCode(room.getRoomCode())
                .name(room.getName())
                .description(room.getDescription())
                .problemId(room.getProblemId())
                .problemTitle(problemTitle)
                .hostUserId(room.getHostUserId())
                .hostUsername(hostUsername)
                .status(room.getStatus())
                .languageId(room.getLanguageId())
                .maxParticipants(room.getMaxParticipants())
                .currentParticipants(currentParticipants)
                .isPublic(room.isPublic())
                .allowVoiceChat(room.isAllowVoiceChat())
                .allowVideoChat(room.isAllowVideoChat())
                .allowScreenShare(room.isAllowScreenShare())
                .createdAt(room.getCreatedAt())
                .lastActivityAt(room.getLastActivityAt())
                .build();
    }

    private ParticipantDto convertToParticipantDto(CodeRoomParticipant participant) {
        User user = userRepository.findById(participant.getUserId()).orElse(null);

        return ParticipantDto.builder()
                .id(participant.getId())
                .userId(participant.getUserId())
                .username(user != null ? user.getUsername() : null)
                .profilePicture(null) // Add profile picture support if needed
                .role(participant.getRole())
                .status(participant.getStatus())
                .joinedAt(participant.getJoinedAt())
                .colorHex(participant.getColorHex())
                .isTyping(participant.isTyping())
                .isMuted(participant.isMuted())
                .isVideoOn(participant.isVideoOn())
                .isScreenSharing(participant.isScreenSharing())
                .build();
    }
}