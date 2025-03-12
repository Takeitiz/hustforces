package com.hust.hustforces.service.impl;

import com.hust.hustforces.enums.SubmissionResult;
import com.hust.hustforces.exception.ResourceNotFoundException;
import com.hust.hustforces.model.entity.ContestSubmission;
import com.hust.hustforces.model.entity.Submission;
import com.hust.hustforces.model.entity.Submissions;
import com.hust.hustforces.repository.ContestSubmissionRepository;
import com.hust.hustforces.repository.SubmissionRepository;
import com.hust.hustforces.service.PointsService;
import com.hust.hustforces.service.SubmissionProcessingService;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
@Slf4j
public class SubmissionProcessingServiceImpl implements SubmissionProcessingService {

    private final SubmissionProcessingService self;

    private final SubmissionRepository submissionRepository;
    private final ContestSubmissionRepository contestSubmissionRepository;
    private final PointsService pointsService;

    @Scheduled(fixedDelay = 1000)
    @Override
    public void processSubmissions() {
        try {
            List<Submission> pendingSubmissions = submissionRepository
                    .findPendingSubmissions(
                            SubmissionResult.PENDING,
                            PageRequest.of(0, 20)
                    );

            for (Submission submission : pendingSubmissions) {
                try {
                    self.updateSubmission(submission);
                } catch (Exception e) {
                    log.error("Error processing submission {}: {}",
                            submission.getId(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Error during processing: ", e);
        }
    }

    @Transactional
    @Override
    public void updateSubmission(Submission submission) {
        boolean isAccepted = true;

        for (Submissions testcase : submission.getTestcases()) {
            switch (testcase.getStatus_id()) {
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
        List<Submissions> testcases = submission.getTestcases();

        double maxTime = testcases.stream()
                .mapToDouble(t -> t.getTime() != null ? t.getTime().doubleValue() : 0)
                .max()
                .orElse(0);

        int maxMemory = testcases.stream()
                .mapToInt(t -> t.getMemory() != null ? t.getMemory() : 0)
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
