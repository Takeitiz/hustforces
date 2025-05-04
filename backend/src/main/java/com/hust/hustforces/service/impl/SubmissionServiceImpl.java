package com.hust.hustforces.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubmissionServiceImpl implements SubmissionService {

    @Value("${judge0.uri}")
    private String judge0Uri;

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

            // Get problem details 
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

    private List<Judge0Response> submitToJudge0(List<Judge0Submission> submissions) {
        if (submissions == null || submissions.isEmpty()) {
            throw new IllegalArgumentException("Cannot submit empty submissions list to Judge0");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        ObjectMapper mapper = new ObjectMapper();
        String jsonBody;
        try {
            Map<String, Object> requestMap = new HashMap<>();
            requestMap.put("submissions", submissions);
            jsonBody = mapper.writeValueAsString(requestMap);
            log.debug("Submitting to Judge0: {}", jsonBody);
        } catch (Exception e) {
            log.error("Failed to serialize request", e);
            throw new RuntimeException("Failed to serialize request", e);
        }

        HttpEntity<String> request = new HttpEntity<>(jsonBody, headers);
        String url = judge0Uri + "/submissions/batch?base64_encoded=false";

        try {
            log.info("Sending batch submission to Judge0");
            ResponseEntity<List<Judge0Response>> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    request,
                    new ParameterizedTypeReference<List<Judge0Response>>() {}
            );

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                log.error("Failed to submit to Judge0: {}", response.getStatusCode());
                throw new RuntimeException("Failed to submit to Judge0: " + response.getStatusCode());
            }

            log.info("Successfully submitted batch of {} submissions to Judge0", submissions.size());
            return response.getBody();
        } catch (Exception e) {
            log.error("Judge0 API error: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to submit to Judge0: " + e.getMessage(), e);
        }
    }

    private List<TestCase> createTestcases(List<Judge0Response> judge0Responses, Submission submission) {
        return judge0Responses.stream()
                .map(response -> {
                    TestCase testcase = new TestCase();

                    testcase.setSource_code(response.getSource_code());
                    testcase.setLanguage_id(response.getLanguage_id());
                    testcase.setCompiler_options(response.getCompiler_options());
                    testcase.setCommand_line_arguments(response.getCommand_line_arguments());
                    testcase.setStdin(response.getStdin());
                    testcase.setExpected_output(response.getExpected_output());
                    testcase.setCpu_time_limit(response.getCpu_time_limit());
                    testcase.setCpu_extra_time(response.getCpu_extra_time());
                    testcase.setWall_time_limit(response.getWall_time_limit());
                    testcase.setMemory_limit(response.getMemory_limit());
                    testcase.setStack_limit(response.getStack_limit());
                    testcase.setMax_processes_and_or_threads(response.getMax_processes_and_or_threads());
                    testcase.setEnable_per_process_and_thread_time_limit(response.getEnable_per_process_and_thread_time_limit());
                    testcase.setEnable_per_process_and_thread_memory_limit(response.getEnable_per_process_and_thread_memory_limit());
                    testcase.setMax_file_size(response.getMax_file_size());
                    testcase.setRedirect_stderr_to_stdout(response.getRedirect_stderr_to_stdout());
                    testcase.setEnable_network(response.getEnable_network());
                    testcase.setNumber_of_runs(response.getNumber_of_runs());
                    testcase.setAdditional_files(response.getAdditional_files());
                    testcase.setCallback_url(response.getCallback_url());
                    testcase.setStdout(response.getStdout());
                    testcase.setStderr(response.getStderr());
                    testcase.setCompile_output(response.getCompile_output());
                    testcase.setMessage(response.getMessage());
                    testcase.setExit_code(response.getExit_code());
                    testcase.setExit_signal(response.getExit_signal());

                    if (response.getStatus() != null) {
                        testcase.setStatus_id(response.getStatus().getId());
                    } else {
                        testcase.setStatus_id(0);
                    }

                    testcase.setCreated_at(response.getCreated_at());
                    testcase.setFinished_at(response.getFinished_at());
                    testcase.setToken(response.getToken());
                    testcase.setTime(response.getTime());
                    testcase.setWall_time(response.getWall_time());
                    testcase.setMemory(response.getMemory());
                    testcase.setSubmissionId(submission.getId());

                    return testcase;
                })
                .collect(Collectors.toList());
    }
}
