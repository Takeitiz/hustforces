package com.hust.hustforces.service.listener;

import com.hust.hustforces.config.RabbitMQConfig;
import com.hust.hustforces.enums.SubmissionResult;
import com.hust.hustforces.enums.SubmissionState;
import com.hust.hustforces.enums.TestCaseProcessingState;
import com.hust.hustforces.exception.ResourceNotFoundException;
import com.hust.hustforces.model.dto.SubmissionCallback;
import com.hust.hustforces.model.entity.Submission;
import com.hust.hustforces.model.entity.TestCase;
import com.hust.hustforces.repository.SubmissionRepository;
import com.hust.hustforces.repository.TestCaseRepository;
import com.hust.hustforces.service.LeaderboardService;
import com.hust.hustforces.service.SubmissionProcessingService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.retry.support.RetryTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class JudgeResultListener {

    private final SubmissionRepository submissionRepository;
    private final SubmissionProcessingService submissionProcessingService;
    private final TestCaseRepository testCaseRepository;
    private final LeaderboardService leaderboardService;
    private final RabbitTemplate rabbitTemplate;
    private final RetryTemplate retryTemplate;

    @RabbitListener(queues = RabbitMQConfig.JUDGE_RESULT_QUEUE_NAME)
    @Transactional
    public void handleJudgeResult(SubmissionCallback callback) {
        String submissionId = callback.getSubmissionId();
        if (submissionId == null) {
            log.error("Received callback message without submissionId. Token: {}", callback.getToken());
            return;
        }

        log.info("Processing judge result from queue for submission: {}, status: {}",
                submissionId, callback.getStatus().getId());

        try {
            // Retrieve submission with retry mechanism for potential deadlocks
            Submission submission = retrieveSubmissionWithRetry(submissionId);

            // Update submission state to track progress
            updateSubmissionState(submission, SubmissionState.PROCESSING);

            // If this is part of a contest, increment attempt count
            if (submission.getActiveContestId() != null) {
                leaderboardService.incrementAttemptCount(
                        submission.getActiveContestId(),
                        submission.getUserId(),
                        submission.getProblemId()
                );
            }

            // Update test case from callback with transaction
            updateTestcaseFromCallback(submission, callback);

            // Check completion status
            boolean allTestcasesProcessed = checkAllTestcasesProcessed(submission);

            if (allTestcasesProcessed) {
                // Process final result
                processCompletedSubmission(submission);
            }
        } catch (ResourceNotFoundException e) {
            log.error("Submission not found while processing result from queue: {}", submissionId, e);
            // Send to dead letter queue for manual review
            sendToDeadLetterQueue(callback, "SUBMISSION_NOT_FOUND");
        } catch (Exception e) {
            log.error("Error processing judge result for submission {}: {}",
                    submissionId, e.getMessage(), e);
            // Requeue message with delay if recoverable
            requeueWithDelay(callback);
        }
    }

    private Submission retrieveSubmissionWithRetry(String submissionId) {
        return retryTemplate.execute(context -> submissionRepository.findByIdWithTestcases(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", "id", submissionId)));
    }

    private void updateSubmissionState(Submission submission, SubmissionState state) {
        submission.setState(state);
        submissionRepository.save(submission);
    }

    private void updateTestcaseFromCallback(Submission submission, SubmissionCallback callback) {
        Optional<TestCase> testcaseOpt = submission.getTestcases().stream()
                .filter(testcase -> callback.getToken().equals(testcase.getToken()))
                .findFirst();

        if (testcaseOpt.isPresent()) {
            TestCase testcase = testcaseOpt.get();
            testcase.setStatusId(callback.getStatus().getId());
            testcase.setProcessingState(TestCaseProcessingState.COMPLETED);

            if (callback.getStdout() != null) {
                testcase.setStdout(callback.getStdout());
            }
            if (callback.getStderr() != null) {
                testcase.setStderr(callback.getStderr());
            }
            if (callback.getTime() != null) {
                try {
                    testcase.setExecutionTime(new BigDecimal(callback.getTime()));
                } catch (NumberFormatException e) {
                    log.warn("Invalid time format '{}' for testcase token {}",
                            callback.getTime(), callback.getToken());
                    testcase.setErrorDetails("Invalid time format: " + callback.getTime());
                }
            }
            testcase.setMemoryUsed(callback.getMemory());

            // Consolidate error information
            String errorDetails = null;
            if (callback.getCompileOutput() != null && !callback.getCompileOutput().isEmpty()) {
                errorDetails = "Compile output: " + callback.getCompileOutput();
            }
            if (callback.getMessage() != null && !callback.getMessage().isEmpty()) {
                errorDetails = (errorDetails == null ? "" : errorDetails + "\n") +
                        "Message: " + callback.getMessage();
            }
            testcase.setErrorDetails(errorDetails);

            testCaseRepository.save(testcase);

            log.debug("Updated testcase with token: {}, status: {}",
                    callback.getToken(), callback.getStatus().getId());
        } else {
            log.warn("No testcase found with token: {} for submission: {}",
                    callback.getToken(), submission.getId());

            // Create a record of the unmatched callback for debugging
            TestCase unmatchedTestcase = new TestCase();
            unmatchedTestcase.setSubmissionId(submission.getId());
            unmatchedTestcase.setToken(callback.getToken());
            unmatchedTestcase.setStatusId(callback.getStatus().getId());
            unmatchedTestcase.setProcessingState(TestCaseProcessingState.FAILED);
            unmatchedTestcase.setErrorDetails("Unmatched callback token");

            testCaseRepository.save(unmatchedTestcase);
        }
    }

    private boolean checkAllTestcasesProcessed(Submission submission) {
        return submission.getTestcases().stream()
                .allMatch(testcase ->
                        testcase.getProcessingState() == TestCaseProcessingState.COMPLETED ||
                                testcase.getProcessingState() == TestCaseProcessingState.FAILED);
    }

    private void processCompletedSubmission(Submission submission) {
        submissionProcessingService.updateSubmission(submission);
        updateSubmissionState(submission, SubmissionState.COMPLETED);

        log.info("All testcases processed for submission: {}, final status: {}",
                submission.getId(), submission.getStatus());

        // Update contest leaderboard if this was a successful submission in a contest
        if (submission.getActiveContestId() != null && submission.getStatus() == SubmissionResult.AC) {
            processContestSuccess(submission);
        }
    }

    private void processContestSuccess(Submission submission) {
        try {
            // Update contest submission
            submissionProcessingService.updateContest(submission);

            // Find points from contest submission and update leaderboard
            submissionRepository.findByIdWithContestSubmission(submission.getId())
                    .ifPresent(submissionWithContestData -> {
                        if (submissionWithContestData.getContestSubmission() != null) {
                            leaderboardService.updateUserScore(
                                    submissionWithContestData.getActiveContestId(),
                                    submissionWithContestData.getUserId(),
                                    submissionWithContestData.getProblemId(),
                                    submissionWithContestData.getContestSubmission().getPoints(),
                                    submission.getId()
                            );
                        }
                    });
        } catch (Exception e) {
            log.error("Error updating contest data for submission {}: {}",
                    submission.getId(), e.getMessage(), e);
            // Record error but don't fail the submission processing
            submission.setContestProcessingError(e.getMessage());
            submissionRepository.save(submission);
        }
    }

    private void sendToDeadLetterQueue(SubmissionCallback callback, String reason) {
        Map<String, Object> message = new HashMap<>();
        message.put("callback", callback);
        message.put("reason", reason);
        message.put("timestamp", System.currentTimeMillis());

        rabbitTemplate.convertAndSend(
                RabbitMQConfig.JUDGE_EXCHANGE_NAME,
                RabbitMQConfig.JUDGE_DLQ_ROUTING_KEY,
                message
        );

        log.info("Sent failed callback to dead letter queue: {}, reason: {}",
                callback.getSubmissionId(), reason);
    }

    private void requeueWithDelay(SubmissionCallback callback) {
        // Set a small delay before requeuing (5 seconds)
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.JUDGE_EXCHANGE_NAME,
                RabbitMQConfig.JUDGE_RETRY_ROUTING_KEY,
                callback,
                message -> {
                    message.getMessageProperties().setDelayLong(5000L);
                    return message;
                }
        );

        log.info("Requeued callback for submission {} with delay", callback.getSubmissionId());
    }
}
