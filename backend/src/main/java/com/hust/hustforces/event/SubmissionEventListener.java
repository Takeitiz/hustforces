package com.hust.hustforces.event;

import com.hust.hustforces.service.impl.UserStatsCalculationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class SubmissionEventListener {
    private final UserStatsCalculationService statsCalculationService;

    @EventListener
    @Async
    public void handleSubmissionCompletedEvent(SubmissionCompletedEvent event) {
        log.debug("Handling submission completed event for userId: {}", event.getUserId());

        // Update user stats asynchronously
        try {
            statsCalculationService.updateUserStats(event.getUserId());
        } catch (Exception e) {
            log.error("Error updating stats for user {} after submission: {}",
                    event.getUserId(), e.getMessage());
        }
    }
}
