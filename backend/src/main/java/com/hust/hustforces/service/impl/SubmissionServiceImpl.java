package com.hust.hustforces.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hust.hustforces.exception.ResourceNotFoundException;
import com.hust.hustforces.model.dto.*;
import com.hust.hustforces.model.entity.Problem;
import com.hust.hustforces.model.entity.Submission;
import com.hust.hustforces.model.entity.Submissions;
import com.hust.hustforces.repository.ProblemRepository;
import com.hust.hustforces.repository.SubmissionRepository;
import com.hust.hustforces.service.ProblemService;
import com.hust.hustforces.service.SubmissionService;
import com.hust.hustforces.utils.LanguageMapping;
import lombok.RequiredArgsConstructor;
import org.apache.coyote.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubmissionServiceImpl implements SubmissionService {

    @Value("${judge0.uri}")
    private String judge0Uri;

    private final SubmissionRepository submissionRepository;
    private final ProblemRepository problemRepository;
    private final ProblemService problemService;
    private final LanguageMapping languageMapping;
    private final RestTemplate restTemplate;

    @Override
    public Submission createSubmission(SubmissionRequest input, String userId) throws IOException {
        Problem problem = problemRepository.findById(input.getProblemId()).orElseThrow(
                () -> new ResourceNotFoundException("Problem", "id", input.getProblemId())
        );

        ProblemDetails problemDetails = problemService.getProblem(problem.getSlug(), input.getLanguageId());
        String fullCode =  problemDetails.getFullBoilerplateCode().replace("##USER_CODE_HERE##", input.getCode());

        List<Judge0Submission> judge0Submissions = createJudge0Submissions(
                problemDetails,
                fullCode,
                input.getLanguageId().toString()
        );

        List<Judge0Response> judge0Responses = submitToJudge0(judge0Submissions);

        Submission submission = new Submission();
        submission.setUserId(userId);
        submission.setProblemId(input.getProblemId());
        submission.setCode(input.getCode());
        submission.setActiveContestId(input.getActiveContestId());

        List<Submissions> testcases = createTestcases(judge0Responses, submission);
        submission.setTestcases(testcases);

        submission = submissionRepository.save(submission);

        return submission;
    }

    @Override
    public Submission getSubmission(String submissionId) throws BadRequestException {
        if (submissionId == null || submissionId.trim().isEmpty()) {
            throw new BadRequestException("Invalid submission id");
        }
        // Add additional business logic later
        // For example, updating solve count, checking permissions, etc.
        return submissionRepository.findByIdWithTestcases(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", "id", submissionId));
    }

    @Override
    public List<Submission> getUserSubmissionsForProblem(String userId, String problemId) {
        return submissionRepository.findByUserIdAndProblemIdOrderByCreatedAtDesc(userId, problemId);
    }

    private List<Judge0Submission> createJudge0Submissions(ProblemDetails problemDetails, String fullCode, String languageId) {
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
                    problemDetails.getOutputs().get(i)
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
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize request", e);
        }

        HttpEntity<String> request = new HttpEntity<>(jsonBody, headers);
        String url = judge0Uri + "/submissions/batch?base64_encoded=false";

        System.out.println(request);

        try {
            ResponseEntity<List<Judge0Response>> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    request,
                    new ParameterizedTypeReference<List<Judge0Response>>() {}
            );

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new RuntimeException("Failed to submit to Judge0: " + response.getStatusCode());
            }

            return response.getBody();
        } catch (Exception e) {
            System.out.println("Judge0 API error: " + e.getMessage());
            throw new RuntimeException("Failed to submit to Judge0: " + e.getMessage(), e);
        }
    }



    private List<Submissions> createTestcases(List<Judge0Response> judge0Responses, Submission submission) {
        return judge0Responses.stream()
                .map(response -> {
                    Submissions testcase = new Submissions();

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
