package com.hust.hustforces.service.impl;

import com.hust.hustforces.config.RabbitMQConfig;
import com.hust.hustforces.enums.SubmissionState;
import com.hust.hustforces.enums.TestCaseProcessingState;
import com.hust.hustforces.model.dto.Judge0Response;
import com.hust.hustforces.model.dto.SubmissionCallback;
import com.hust.hustforces.model.entity.Submission;
import com.hust.hustforces.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubmissionMonitoringService {

    private final SubmissionRepository submissionRepository;
    private final Judge0Client judge0Client;
    private final RabbitTemplate rabbitTemplate;

    /**
     * Scheduled task to check for stalled submissions and retry
     */
    @Scheduled(fixedDelay = 60000) // Every minute
    public void checkStalledSubmissions() {
        LocalDateTime cutoffTime = LocalDateTime.now().minusMinutes(5);

        List<Submission> stalledSubmissions = submissionRepository
                .findByStateAndCreatedAtBefore(
                        SubmissionState.PROCESSING,
                        cutoffTime,
                        PageRequest.of(0, 50));

        if (!stalledSubmissions.isEmpty()) {
            log.info("Found {} stalled submissions to retry", stalledSubmissions.size());

            for (Submission submission : stalledSubmissions) {
                // Increment retry count
                submission.setProcessingAttempts(submission.getProcessingAttempts() + 1);

                if (submission.getProcessingAttempts() > 3) {
                    // Too many retries, mark as failed
                    submission.setState(SubmissionState.FAILED);
                    submissionRepository.save(submission);
                    continue;
                }

                // Retry processing by checking testcases directly
                submission.getTestcases().stream()
                        .filter(tc -> tc.getProcessingState() == TestCaseProcessingState.PENDING)
                        .forEach(tc -> {
                            try {
                                // Query Judge0 for status
                                Judge0Response response = judge0Client.getSubmissionStatus(tc.getToken());

                                // Create callback and send to queue
                                SubmissionCallback callback = createCallbackFromResponse(
                                        response, submission.getId());

                                rabbitTemplate.convertAndSend(
                                        RabbitMQConfig.JUDGE_EXCHANGE_NAME,
                                        RabbitMQConfig.JUDGE_RESULT_ROUTING_KEY,
                                        callback
                                );

                                log.info("Re-queued result for submission: {}, testcase: {}",
                                        submission.getId(), tc.getId());
                            } catch (Exception e) {
                                log.error("Error retrying testcase: {}", tc.getId(), e);
                            }
                        });

                submissionRepository.save(submission);
            }
        }
    }

    private SubmissionCallback createCallbackFromResponse(Judge0Response response, String submissionId) {
        SubmissionCallback callback = new SubmissionCallback();
        callback.setSubmissionId(submissionId);
        callback.setToken(response.getToken());

        // Convert status from response
        SubmissionCallback.Status status = new SubmissionCallback.Status();
        if (response.getStatus() != null) {
            status.setId(response.getStatus().getId());
            status.setDescription(response.getStatus().getDescription());
        } else {
            status.setId(0);
            status.setDescription("Unknown");
        }
        callback.setStatus(status);

        // Set other fields
        callback.setStdout(response.getStdout());
        callback.setStderr(response.getStderr());
        if (response.getTime() != null) {
            callback.setTime(response.getTime().toString());
        }
        callback.setMemory(response.getMemory());
        callback.setCompileOutput(response.getCompile_output());
        callback.setMessage(response.getMessage());

        return callback;
    }
}
