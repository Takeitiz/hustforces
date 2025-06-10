package com.hust.hustforces.service.impl;

import com.hust.hustforces.config.RabbitMQConfig;
import com.hust.hustforces.enums.SubmissionState;
import com.hust.hustforces.enums.TestCaseProcessingState;
import com.hust.hustforces.model.dto.Judge0Response;
import com.hust.hustforces.model.dto.SubmissionCallback;
import com.hust.hustforces.model.entity.Submission;
import com.hust.hustforces.model.entity.TestCase;
import com.hust.hustforces.repository.SubmissionRepository;
import jakarta.transaction.Transactional;
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

    @Scheduled(fixedDelay = 60000)
    @Transactional  // ADD THIS
    public void checkStalledSubmissions() {
        LocalDateTime cutoffTime = LocalDateTime.now().minusMinutes(5);

        List<Submission> stalledSubmissions = submissionRepository
                .findStalledSubmissionsWithTestcases(
                        SubmissionState.PROCESSING,
                        cutoffTime,
                        PageRequest.of(0, 50));

        if (!stalledSubmissions.isEmpty()) {
            log.info("Found {} stalled submissions to retry", stalledSubmissions.size());

            for (Submission submission : stalledSubmissions) {
                processStalledSubmission(submission);
            }
        }
    }

    private void processStalledSubmission(Submission submission) {
        submission.setProcessingAttempts(submission.getProcessingAttempts() + 1);

        if (submission.getProcessingAttempts() > 3) {
            submission.setState(SubmissionState.FAILED);
            submissionRepository.save(submission);
            return;
        }

        // Retry processing testcases
        submission.getTestcases().stream()
                .filter(tc -> tc.getProcessingState() == TestCaseProcessingState.PENDING)
                .forEach(tc -> retryTestCase(tc, submission.getId()));

        submissionRepository.save(submission);
    }

    private void retryTestCase(TestCase testCase, String submissionId) {
        try {
            Judge0Response response = judge0Client.getSubmissionStatus(testCase.getToken());
            SubmissionCallback callback = createCallbackFromResponse(response, submissionId);

            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.JUDGE_EXCHANGE_NAME,
                    RabbitMQConfig.JUDGE_RESULT_ROUTING_KEY,
                    callback
            );

            log.info("Re-queued result for submission: {}, testcase: {}",
                    submissionId, testCase.getId());
        } catch (Exception e) {
            log.error("Error retrying testcase: {}", testCase.getId(), e);
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
