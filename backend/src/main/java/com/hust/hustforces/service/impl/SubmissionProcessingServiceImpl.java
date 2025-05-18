package com.hust.hustforces.service.impl;

import com.hust.hustforces.enums.SubmissionResult;
import com.hust.hustforces.exception.ResourceNotFoundException;
import com.hust.hustforces.model.entity.ContestSubmission;
import com.hust.hustforces.model.entity.Submission;
import com.hust.hustforces.model.entity.TestCase;
import com.hust.hustforces.repository.ContestSubmissionRepository;
import com.hust.hustforces.repository.SubmissionRepository;
import com.hust.hustforces.service.PointsService;
import com.hust.hustforces.service.SubmissionProcessingService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubmissionProcessingServiceImpl implements SubmissionProcessingService {
    private final SubmissionRepository submissionRepository;
    private final ContestSubmissionRepository contestSubmissionRepository;
    private final PointsService pointsService;

    @Transactional
    @Override
    public void updateSubmission(Submission submission) {
        boolean isAccepted = true;

        if (submission.getTestcases() != null) {
            for (TestCase testcase : submission.getTestcases()) {
                switch (testcase.getStatusId()) {
                    case 0:
                    case 1:
                    case 2:
                        isAccepted = false;
                        break;
                    case 3:
                        break;
                    default:
                        submission.setStatus(SubmissionResult.REJECTED);
                        submissionRepository.save(submission);
                        return;
                }

                if (!isAccepted) {
                    break;
                }
            }
        }

        if (isAccepted && !submission.getTestcases().isEmpty()) {
            updateMemoryAndExecution(submission);
            if (submission.getActiveContestId() != null) {
                updateContest(submission);
            }
            submission.setStatus(SubmissionResult.AC);
            submissionRepository.save(submission);
        }
    }

    private void updateMemoryAndExecution(Submission submission) {
        List<TestCase> testcases = submission.getTestcases();

        double maxTime = testcases.stream()
                .mapToDouble(t -> t.getExecutionTime() != null ? t.getExecutionTime().doubleValue() : 0)
                .max()
                .orElse(0);

        int maxMemory = testcases.stream()
                .mapToInt(t -> t.getMemoryUsed() != null ? t.getMemoryUsed() : 0)
                .max()
                .orElse(0);

        submission.setTime(maxTime);
        submission.setMemory(maxMemory);
    }

    @Transactional
    @Override
    public void updateContest(Submission submission) {
        Submission contestSubmission = submissionRepository.findByIdWithContestAndProblem(submission.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Submission", "id", submission.getId()));

        if (contestSubmission.getActiveContestId() == null ||
            contestSubmission.getActiveContest() == null ||
            contestSubmission.getActiveContest().getStartTime() == null ||
            submission.getActiveContestId() == null) {
            return;
        }

        double points = pointsService.calculatePoints(
                submission.getActiveContestId(),
                submission.getUserId(),
                submission.getProblemId(),
                submission.getProblem().getDifficulty(),
                submission.getActiveContest().getStartTime(),
                submission.getActiveContest().getEndTime()
        );

        Optional<ContestSubmission> optionalSubmission = contestSubmissionRepository
                .findByUserIdAndProblemIdAndContestId(
                        submission.getUserId(),
                        submission.getProblemId(),
                        submission.getActiveContestId()
                );

        if (optionalSubmission.isPresent()) {
            ContestSubmission existingSubmission = optionalSubmission.get();
            existingSubmission.setPoints((int) points);
            contestSubmissionRepository.save(existingSubmission);
        } else {
            ContestSubmission newContestSubmission = new ContestSubmission();
            newContestSubmission.setSubmissionId(submission.getId());
            newContestSubmission.setUserId(submission.getUserId());
            newContestSubmission.setProblemId(submission.getProblemId());
            newContestSubmission.setContestId(submission.getActiveContestId());
            newContestSubmission.setPoints((int) points);
            contestSubmissionRepository.save(newContestSubmission);
        }
    }
}
