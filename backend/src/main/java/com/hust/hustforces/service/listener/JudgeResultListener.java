package com.hust.hustforces.service.listener;

import com.hust.hustforces.config.RabbitMQConfig;
import com.hust.hustforces.enums.SubmissionResult;
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
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class JudgeResultListener {

    private final SubmissionRepository submissionRepository;
    private final SubmissionProcessingService submissionProcessingService;
    private final TestCaseRepository testCaseRepository;
    private final LeaderboardService leaderboardService;

    @RabbitListener(queues = RabbitMQConfig.JUDGE_RESULT_QUEUE_NAME)
    @Transactional
    public void handleJudgeResult(SubmissionCallback callback) {
        String submissionId = callback.getSubmissionId();
        if (submissionId == null) {
            log.error("Received callback message without submissionId. Token: {}", callback.getToken());
            return;
        }

        log.info("Processing judge result from queue for submission: {}, status: {}", submissionId, callback.getStatus().getId());

        try {
            Submission submission = submissionRepository.findByIdWithTestcases(submissionId)
                    .orElseThrow(() -> new ResourceNotFoundException("Submission", "id", submissionId));

            // If this is part of a contest, increment attempt count
            if (submission.getActiveContestId() != null) {
                leaderboardService.incrementAttemptCount(
                        submission.getActiveContestId(),
                        submission.getUserId(),
                        submission.getProblemId()
                );
            }

            updateTestcaseFromCallback(submission, callback);

            boolean allTestcasesProcessed = submission.getTestcases().stream()
                    .noneMatch(testcase -> testcase.getStatus_id() == 1 || testcase.getStatus_id() == 2);

            if (allTestcasesProcessed) {
                submissionProcessingService.updateSubmission(submission);
                log.info("All testcases processed for submission: {}, final status determined: {}", submissionId, submission.getStatus());

                // Update contest leaderboard if this was a successful submission in a contest
                if (submission.getActiveContestId() != null && submission.getStatus() == SubmissionResult.AC) {
                    // Check if we have a ContestSubmission created and get its points
                    submissionProcessingService.updateContest(submission);

                    // Find points from contest submission (should be created by updateContest)
                    // and update leaderboard
                    submissionRepository.findByIdWithContestSubmission(submissionId)
                            .ifPresent(submissionWithContestData -> {
                                if (submissionWithContestData.getContestSubmission() != null) {
                                    leaderboardService.updateUserScore(
                                            submissionWithContestData.getActiveContestId(),
                                            submissionWithContestData.getUserId(),
                                            submissionWithContestData.getProblemId(),
                                            submissionWithContestData.getContestSubmission().getPoints(),
                                            submissionId
                                    );
                                }
                            });
                }
            } else {
                log.debug("Submission {} still has pending/processing testcases.", submissionId);
            }
        } catch (ResourceNotFoundException e) {
            log.error("Submission not found while processing result from queue: {}", submissionId, e);
        } catch (Exception e) {
            log.error("Error processing judge result for submission {}: {}", submissionId, e.getMessage(), e);
            throw new RuntimeException("Failed to process judge result for submission " + submissionId, e);
        }
    }

    private void updateTestcaseFromCallback(Submission submission, SubmissionCallback callback) {
        Optional<TestCase> testcaseOpt = submission.getTestcases().stream()
                .filter(testcase -> callback.getToken().equals(testcase.getToken()))
                .findFirst();

        if (testcaseOpt.isPresent()) {
            TestCase testcase = testcaseOpt.get();
            testcase.setStatus_id(callback.getStatus().getId());

            if (callback.getStdout() != null) {
                testcase.setStdout(callback.getStdout());
            }
            if (callback.getStderr() != null) {
                testcase.setStderr(callback.getStderr());
            }
            if (callback.getTime() != null) {
                try {
                    testcase.setTime(new BigDecimal(callback.getTime()));
                } catch (NumberFormatException e) {
                    log.warn("Invalid time format '{}' for testcase token {}", callback.getTime(), callback.getToken());
                }
            }
            testcase.setMemory(callback.getMemory());
            testcase.setFinished_at(LocalDateTime.now());
            if (callback.getCompileOutput() != null) {
                testcase.setCompile_output(callback.getCompileOutput());
            }
            if (callback.getMessage() != null) {
                testcase.setMessage(callback.getMessage());
            }

            testCaseRepository.save(testcase);

            for (int i = 0; i < submission.getTestcases().size(); i++) {
                if (testcase.getToken().equals(submission.getTestcases().get(i).getToken())) {
                    submission.getTestcases().set(i, testcase);
                    break;
                }
            }

            log.debug("Updated testcase with token: {}, status: {}",
                    callback.getToken(), callback.getStatus().getId());
        } else {
            log.warn("No testcase found with token: {} for submission: {}",
                    callback.getToken(), submission.getId());
        }
    }
}
