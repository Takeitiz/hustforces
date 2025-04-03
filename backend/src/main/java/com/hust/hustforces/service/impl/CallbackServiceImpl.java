package com.hust.hustforces.service.impl;

import com.hust.hustforces.exception.ResourceNotFoundException;
import com.hust.hustforces.model.dto.Judge0Response;
import com.hust.hustforces.model.dto.SubmissionCallback;
import com.hust.hustforces.model.entity.Submission;
import com.hust.hustforces.model.entity.Submissions;
import com.hust.hustforces.model.entity.TestCase;
import com.hust.hustforces.repository.SubmissionRepository;
import com.hust.hustforces.repository.SubmissionsRepository;
import com.hust.hustforces.repository.TestCaseRepository;
import com.hust.hustforces.service.CallbackService;
import com.hust.hustforces.service.SubmissionProcessingService;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@AllArgsConstructor
@Slf4j
public class CallbackServiceImpl implements CallbackService {

    private final SubmissionRepository submissionRepository;
    private final SubmissionProcessingService submissionProcessingService;
    private final TestCaseRepository testCaseRepository;

    @Override
    @Transactional
    public void processCallback(String submissionId, SubmissionCallback callback) {
        log.info("Processing callback for submission: {}, status: {}", submissionId, callback.getStatus().getId());

        Submission submission = submissionRepository.findByIdWithTestcases(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", "id", submissionId));

        updateTestcaseFromCallback(submission, callback);

        boolean allTestcasesProcessed = submission.getTestcases().stream()
                .noneMatch(testcase -> testcase.getStatus_id() == 1 || testcase.getStatus_id() == 2);

        if (allTestcasesProcessed) {
            submissionProcessingService.updateSubmission(submission);
            log.info("All testcases processed for submission: {}, final status: {}", submissionId, submission.getStatus());
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
                testcase.setTime(new BigDecimal(callback.getTime()));
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
