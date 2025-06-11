package com.hust.hustforces.controller;

import com.hust.hustforces.model.dto.coderoom.*;
import com.hust.hustforces.model.entity.User;
import com.hust.hustforces.repository.UserRepository;
import com.hust.hustforces.service.CodeRoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
@Slf4j
public class CodeRoomWebSocketController {

    private final CodeRoomService codeRoomService;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/coderoom/{roomId}/code")
    public void handleCodeChange(
            @DestinationVariable String roomId,
            @Payload CodeChangeDto codeChange,
            Principal principal) {

        log.debug("Code change in room {} from user {}", roomId, principal.getName());

        String userId = getUserIdFromPrincipal(principal);
        codeChange.setUserId(userId);
        codeChange.setTimestamp(System.currentTimeMillis());

        // Apply the change
        codeRoomService.updateCode(roomId, codeChange, userId);
    }

    @MessageMapping("/coderoom/{roomId}/cursor")
    public void handleCursorUpdate(
            @DestinationVariable String roomId,
            @Payload CursorPositionDto cursorPosition,
            Principal principal) {

        String userId = getUserIdFromPrincipal(principal);
        codeRoomService.updateCursorPosition(roomId, cursorPosition, userId);
    }

    @MessageMapping("/coderoom/{roomId}/typing")
    public void handleTypingStatus(
            @DestinationVariable String roomId,
            @Payload TypingStatusDto typingStatus,
            Principal principal) {

        String userId = getUserIdFromPrincipal(principal);

        // Broadcast typing status to other participants
        messagingTemplate.convertAndSend(
                "/topic/coderoom/" + roomId + "/typing",
                new UserTypingEvent(userId, typingStatus.isTyping())
        );
    }

    @MessageMapping("/coderoom/{roomId}/webrtc/signal")
    public void handleWebRTCSignal(
            @DestinationVariable String roomId,
            @Payload WebRTCSignalDto signal,
            Principal principal) {

        String fromUserId = getUserIdFromPrincipal(principal);
        signal.setFromUserId(fromUserId);

        log.debug("WebRTC signal in room {} from {} to {}",
                roomId, fromUserId, signal.getToUserId());

        // Send signal to specific user
        messagingTemplate.convertAndSendToUser(
                signal.getToUserId(),
                "/queue/coderoom/" + roomId + "/webrtc",
                signal
        );
    }

    @MessageMapping("/coderoom/{roomId}/webrtc/media-state")
    public void handleMediaStateChange(
            @DestinationVariable String roomId,
            @Payload MediaStateDto mediaState,
            Principal principal) {

        String userId = getUserIdFromPrincipal(principal);

        // Broadcast media state change to all participants
        messagingTemplate.convertAndSend(
                "/topic/coderoom/" + roomId + "/media-state",
                new UserMediaStateEvent(userId, mediaState)
        );
    }

    @MessageMapping("/coderoom/{roomId}/sync")
    @SendToUser("/queue/coderoom/sync-response")
    public CodeRoomSyncResponse handleSyncRequest(
            @DestinationVariable String roomId,
            Principal principal) {

        String userId = getUserIdFromPrincipal(principal);

        log.info("Sync request for room {} from user {}", roomId, userId);

        // Get current state
        String currentCode = codeRoomService.getCurrentCode(roomId);
        var participants = codeRoomService.getActiveParticipants(roomId);

        return CodeRoomSyncResponse.builder()
                .roomId(roomId)
                .currentCode(currentCode)
                .participants(participants)
                .build();
    }

    @MessageExceptionHandler
    @SendToUser("/queue/errors")
    public ErrorMessage handleException(Exception e) {
        log.error("WebSocket error", e);
        return new ErrorMessage(e.getMessage());
    }

    private String getUserIdFromPrincipal(Principal principal) {
        if (principal == null) {
            throw new IllegalStateException("No principal found");
        }

        String username = principal.getName();
        log.debug("Getting user ID for username: {}", username);

        // Look up user by username to get their ID
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.error("User not found for username: {}", username);
                    return new RuntimeException("User not found: " + username);
                });

        return user.getId();
    }
}