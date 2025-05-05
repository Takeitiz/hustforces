package com.hust.hustforces.service.impl;

import com.hust.hustforces.enums.LanguageId;
import com.hust.hustforces.enums.SubmissionResult;
import com.hust.hustforces.enums.SubmissionState;
import com.hust.hustforces.exception.ResourceNotFoundException;
import com.hust.hustforces.mapper.SubmissionMapper;
import com.hust.hustforces.model.dto.*;
import com.hust.hustforces.model.dto.submission.SubmissionDetailDto;
import com.hust.hustforces.model.dto.submission.SubmissionResponseDto;
import com.hust.hustforces.model.dto.submission.TestCaseDto;
import com.hust.hustforces.model.entity.*;
import com.hust.hustforces.repository.ProblemRepository;
import com.hust.hustforces.repository.SubmissionRepository;
import com.hust.hustforces.repository.TestCaseRepository;
import com.hust.hustforces.repository.UserRepository;
import com.hust.hustforces.service.ProblemService;
import com.hust.hustforces.service.SubmissionService;
import com.hust.hustforces.utils.LanguageMapping;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.coyote.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubmissionServiceImpl implements SubmissionService {

    @Value("${server.base-url:http://localhost:8080}")
    private String baseUrl;

    private final SubmissionRepository submissionRepository;
    private final ProblemRepository problemRepository;
    private final ProblemService problemService;
    private final UserRepository userRepository;
    private final TestCaseRepository testCaseRepository;
    private final SubmissionMapper submissionMapper;
    private final SubmissionCacheService cacheService;
    private final Judge0Client judge0Client;
    private final LanguageMapping languageMapping;

    // Simple rate limiter - allow up to 10 submissions per minute per user
    private final Map<String, List<Long>> userSubmissionTimestamps = new HashMap<>();
    private final int MAX_SUBMISSIONS_PER_MINUTE = 10;
    private final Object rateLimitLock = new Object();

    @Override
    @Transactional
    public SubmissionDetailDto createSubmission(SubmissionRequest input, String userId) throws IOException {
        // Apply rate limiting
        if (!checkRateLimit(userId)) {
            throw new IllegalStateException("Rate limit exceeded. Please wait before submitting again.");
        }

        Problem problem = problemRepository.findById(input.getProblemId()).orElseThrow(
                () -> new ResourceNotFoundException("Problem", "id", input.getProblemId())
        );

        // Create submission entity first
        Submission submission = new Submission();
        submission.setUserId(userId);
        submission.setProblemId(input.getProblemId());
        submission.setCode(input.getCode());
        submission.setActiveContestId(input.getActiveContestId());
        submission.setLanguageId(input.getLanguageId());
        submission.setStatus(SubmissionResult.PENDING);
        submission.setState(SubmissionState.CREATED);

        Submission savedSubmission = submissionRepository.save(submission);
        log.info("Created submission {} for problem {}, user {}",
                savedSubmission.getId(), problem.getId(), userId);

        // Get basic user info for the response
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Create initial DTO with no test cases yet
        SubmissionDetailDto initialResponse = submissionMapper.toSubmissionDetailDto(
                savedSubmission, problem, user, Collections.emptyList());

        // Process the submission asynchronously to improve response time
        CompletableFuture.runAsync(() -> {
            try {
                processSubmission(savedSubmission, problem, input.getLanguageId());
            } catch (Exception e) {
                log.error("Error processing submission {}: {}", savedSubmission.getId(), e.getMessage(), e);
                updateSubmissionState(savedSubmission.getId(), SubmissionState.FAILED);
            }
        });

        return initialResponse;
    }

    @Override
    public SubmissionDetailDto getSubmission(String submissionId) throws BadRequestException {
        if (submissionId == null || submissionId.trim().isEmpty()) {
            throw new BadRequestException("Invalid submission id");
        }

        // Check cache first
        Optional<SubmissionDetailDto> cachedResult = cacheService.getCachedSubmissionResult(submissionId);
        if (cachedResult.isPresent()) {
            return cachedResult.get();
        }

        // If not in cache, get from database
        Submission submission = submissionRepository.findByIdWithTestcases(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", "id", submissionId));

        Problem problem = problemRepository.findById(submission.getProblemId())
                .orElseThrow(() -> new ResourceNotFoundException("Problem", "id", submission.getProblemId()));

        User user = userRepository.findById(submission.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", submission.getUserId()));

        List<TestCaseDto> testCaseDtos = submission.getTestcases().stream()
                .map(submissionMapper::toTestCaseDto)
                .collect(Collectors.toList());

        SubmissionDetailDto result = submissionMapper.toSubmissionDetailDto(
                submission, problem, user, testCaseDtos);

        // Cache the result if submission is complete
        if (submission.getState() == SubmissionState.COMPLETED) {
            cacheService.cacheSubmissionResult(result);
        }

        return result;
    }

    @Override
    public List<SubmissionResponseDto> getUserSubmissionsForProblem(String userId, String problemId) {
        List<Submission> submissions = submissionRepository.findByUserIdAndProblemIdOrderByCreatedAtDesc(userId, problemId);

        // Get all unique problem IDs
        Set<String> problemIds = submissions.stream()
                .map(Submission::getProblemId)
                .collect(Collectors.toSet());

        Map<String, Problem> problemMap = problemRepository.findAllById(problemIds).stream()
                .collect(Collectors.toMap(Problem::getId, p -> p));

        return submissions.stream()
                .map(submission -> {
                    Problem problem = problemMap.get(submission.getProblemId());

                    // Calculate test case stats
                    int totalTestCases = submission.getTestcases() != null ? submission.getTestcases().size() : 0;
                    int passedTestCases = submission.getTestcases() != null ?
                            (int) submission.getTestcases().stream()
                                    .filter(tc -> tc.getStatusId() != null && tc.getStatusId() == 3)
                                    .count() : 0;

                    return submissionMapper.toSubmissionResponseDto(
                            submission, problem, passedTestCases, totalTestCases);
                })
                .collect(Collectors.toList());
    }

    private void processSubmission(Submission submission, Problem problem, LanguageId languageId) {
        try {
            updateSubmissionState(submission.getId(), SubmissionState.SUBMITTED);

            // Get problem details and prepare full code
            ProblemDetails problemDetails = problemService.getProblem(problem.getSlug(), languageId);
            String fullCode = problemDetails.getFullBoilerplateCode().replace("##USER_CODE_HERE##", submission.getCode());

            // Create Judge0 submissions
            List<Judge0Submission> judge0Submissions = createJudge0Submissions(
                    problemDetails,
                    fullCode,
                    languageId.toString(),
                    submission.getId()
            );

            // Submit to Judge0 with retry
            List<Judge0Response> judge0Responses = judge0Client.submitBatch(judge0Submissions);

            // Update submission state
            updateSubmissionState(submission.getId(), SubmissionState.PROCESSING);

            // Create test cases
            List<TestCase> testcases = createTestcases(judge0Responses, submission);

            // Save test cases
            testCaseRepository.saveAll(testcases);

            log.info("Successfully submitted {} test cases for submission: {}",
                    testcases.size(), submission.getId());

        } catch (Exception e) {
            log.error("Error preparing submission {}: {}", submission.getId(), e.getMessage(), e);
            updateSubmissionState(submission.getId(), SubmissionState.FAILED);
            throw new RuntimeException("Failed to process submission", e);
        }
    }

    private List<Judge0Submission> createJudge0Submissions(
            ProblemDetails problemDetails,
            String fullCode,
            String languageId,
            String submissionId) {

        List<Judge0Submission> submissions = new ArrayList<>();
        Judge0Language language = languageMapping.getMapping(languageId);

        if (language == null) {
            throw new IllegalArgumentException("Unsupported language: " + languageId);
        }

        for (int i = 0; i < problemDetails.getInputs().size(); ++i) {
            String codeWithInput = fullCode.replace("##INPUT_FILE_INDEX##", String.valueOf(i));

            Judge0Submission submission = new Judge0Submission(
                    language.getJudge0(),
                    codeWithInput,
                    problemDetails.getOutputs().get(i),
                    baseUrl,
                    submissionId
            );

            submissions.add(submission);
        }

        return submissions;
    }

    private List<TestCase> createTestcases(List<Judge0Response> judge0Responses, Submission submission) {
        return judge0Responses.stream()
                .map(response -> {
                    TestCase testcase = new TestCase();

                    testcase.setSubmissionId(submission.getId());
                    testcase.setStdin(response.getStdin());
                    testcase.setStdout(response.getStdout());
                    testcase.setStderr(response.getStderr());
                    testcase.setExpectedOutput(response.getExpected_output());
                    testcase.setStatusId(response.getStatus() != null ? response.getStatus().getId() : 0);
                    testcase.setToken(response.getToken());

                    return testcase;
                })
                .collect(Collectors.toList());
    }

    private void updateSubmissionState(String submissionId, SubmissionState state) {
        submissionRepository.findById(submissionId).ifPresent(submission -> {
            submission.setState(state);
            submissionRepository.save(submission);
            log.debug("Updated submission {} state to {}", submissionId, state);
        });
    }

    private boolean checkRateLimit(String userId) {
        long currentTime = System.currentTimeMillis();
        long oneMinuteAgo = currentTime - 60000;

        synchronized (rateLimitLock) {
            List<Long> timestamps = userSubmissionTimestamps.computeIfAbsent(userId, k -> new ArrayList<>());

            // Remove timestamps older than one minute
            timestamps.removeIf(timestamp -> timestamp < oneMinuteAgo);

            // Check if user is within limit
            if (timestamps.size() >= MAX_SUBMISSIONS_PER_MINUTE) {
                return false;
            }

            // Add current timestamp
            timestamps.add(currentTime);
            return true;
        }
    }
}
