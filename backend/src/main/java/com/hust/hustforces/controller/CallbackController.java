package com.hust.hustforces.controller;

import com.hust.hustforces.config.RabbitMQConfig;
import com.hust.hustforces.model.dto.SubmissionCallback;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/callback")
@RequiredArgsConstructor
@Slf4j
public class CallbackController {
    private final RabbitTemplate rabbitTemplate;

    @PutMapping("/{submissionId}")
    public ResponseEntity<String> handleCallback(@PathVariable("submissionId") String submissionId, @RequestBody SubmissionCallback callback) {
        log.info("Received callback for submission ID: {}, publishing to queue.", submissionId);

        callback.setSubmissionId(submissionId);

        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.JUDGE_EXCHANGE_NAME,
                    RabbitMQConfig.JUDGE_RESULT_ROUTING_KEY,
                    callback
            );
            log.info("Callback for submission {} published successfully.", submissionId);
            return ResponseEntity.ok("Callback received and queued.");
        } catch (Exception e) {
            log.error("Error publishing callback for submission {} to queue: {}", submissionId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Error queueing callback: " + e.getMessage());
        }
    }
}
