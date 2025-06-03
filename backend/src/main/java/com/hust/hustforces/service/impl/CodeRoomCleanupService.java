package com.hust.hustforces.service.impl;

import com.hust.hustforces.enums.CodeRoomStatus;
import com.hust.hustforces.enums.ParticipantStatus;
import com.hust.hustforces.model.dto.coderoom.ParticipantStatusChangeEvent;
import com.hust.hustforces.model.entity.CodeRoom;
import com.hust.hustforces.model.entity.CodeRoomParticipant;
import com.hust.hustforces.model.entity.CodeRoomSession;
import com.hust.hustforces.repository.CodeRoomParticipantRepository;
import com.hust.hustforces.repository.CodeRoomRepository;
import com.hust.hustforces.repository.CodeRoomSessionRepository;
import com.hust.hustforces.service.CodeRoomSyncService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CodeRoomCleanupService {

    private final CodeRoomRepository codeRoomRepository;
    private final CodeRoomParticipantRepository participantRepository;
    private final CodeRoomSessionRepository sessionRepository;
    private final CodeRoomSyncService syncService;
    private final SimpMessagingTemplate messagingTemplate;

    private static final int INACTIVE_MINUTES = 30;
    private static final int ABANDONED_HOURS = 2;

    /**
     * Clean up inactive participants every 5 minutes
     */
    @Scheduled(fixedDelay = 300000) // 5 minutes
    public void cleanupInactiveParticipants() {
        log.debug("Running inactive participant cleanup");

        LocalDateTime inactiveThreshold = LocalDateTime.now().minusMinutes(INACTIVE_MINUTES);

        List<CodeRoomParticipant> inactiveParticipants =
                participantRepository.findInactiveParticipants(inactiveThreshold);

        for (CodeRoomParticipant participant : inactiveParticipants) {
            log.info("Marking participant {} as disconnected in room {}",
                    participant.getUserId(), participant.getCodeRoomId());

            participant.setStatus(ParticipantStatus.DISCONNECTED);
            participantRepository.save(participant);

            // Notify other participants
            messagingTemplate.convertAndSend(
                    "/topic/coderoom/" + participant.getCodeRoomId() + "/participants",
                    new ParticipantStatusChangeEvent(
                            participant.getUserId(),
                            ParticipantStatus.DISCONNECTED
                    )
            );
        }
    }

    /**
     * Clean up abandoned rooms every hour
     */
    @Scheduled(fixedDelay = 3600000) // 1 hour
    public void cleanupAbandonedRooms() {
        log.info("Running abandoned room cleanup");

        LocalDateTime abandonedThreshold = LocalDateTime.now().minusHours(ABANDONED_HOURS);

        List<CodeRoom> inactiveRooms =
                codeRoomRepository.findInactiveRooms(abandonedThreshold);

        for (CodeRoom room : inactiveRooms) {
            // Check if room has any active participants
            int activeCount = participantRepository.countActiveParticipants(room.getId());

            if (activeCount == 0) {
                log.info("Closing abandoned room: {} ({})", room.getName(), room.getRoomCode());

                // Update room status
                room.setStatus(CodeRoomStatus.ABANDONED);
                room.setClosedAt(LocalDateTime.now());
                codeRoomRepository.save(room);

                // End any open sessions
                sessionRepository.findTopByCodeRoomIdAndEndedAtIsNullOrderByStartedAtDesc(room.getId())
                        .ifPresent(session -> {
                            session.setEndedAt(LocalDateTime.now());
                            session.setDurationMinutes(
                                    (int) ChronoUnit.MINUTES.between(
                                            session.getStartedAt(),
                                            LocalDateTime.now()
                                    )
                            );
                            session.setFinalCode(syncService.getCurrentCode(room.getId()));
                            sessionRepository.save(session);
                        });

                // Clean up sync data
                syncService.cleanupRoom(room.getId());

                // Mark all participants as left
                List<CodeRoomParticipant> participants =
                        participantRepository.findByCodeRoomIdAndStatus(
                                room.getId(),
                                ParticipantStatus.DISCONNECTED
                        );

                participants.forEach(p -> {
                    p.setStatus(ParticipantStatus.LEFT);
                    p.setLeftAt(LocalDateTime.now());
                });

                participantRepository.saveAll(participants);
            }
        }
    }

    /**
     * Generate room statistics every day
     */
    @Scheduled(cron = "0 0 2 * * ?") // 2 AM every day
    public void generateRoomStatistics() {
        log.info("Generating room statistics");

        LocalDateTime yesterday = LocalDateTime.now().minusDays(1);
        LocalDateTime today = LocalDateTime.now();

        // Count active rooms
        long activeRooms = codeRoomRepository.countActiveRooms();

        // Get sessions from yesterday
        List<CodeRoomSession> yesterdaySessions =
                sessionRepository.findSessionsInDateRange(yesterday, today);

        // Calculate statistics
        int totalSessions = yesterdaySessions.size();
        int totalParticipants = yesterdaySessions.stream()
                .mapToInt(CodeRoomSession::getParticipantsCount)
                .sum();
        int totalDurationMinutes = yesterdaySessions.stream()
                .mapToInt(s -> s.getDurationMinutes() != null ? s.getDurationMinutes() : 0)
                .sum();

        log.info("Daily statistics - Active rooms: {}, Sessions: {}, Participants: {}, Total duration: {} minutes",
                activeRooms, totalSessions, totalParticipants, totalDurationMinutes);

        // In a production system, you might want to store these statistics
        // in a separate table or send them to a monitoring service
    }
}
