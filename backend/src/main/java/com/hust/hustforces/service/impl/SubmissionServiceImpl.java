package com.hust.hustforces.service.impl;

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
    public Submission createSubmission(SubmissionInput input, String userId) throws IOException {
//        Problem problem = problemRepository.findById(input.getProblemId()).orElseThrow(
//                () -> new ResourceNotFoundException("Problem", "id", input.getProblemId())
//        );

//        ProblemDetails problemDetails = problemService.getProblem(problem.getSlug(), input.getLanguageId());
        ProblemDetails problemDetails = problemService.getProblem("max-element", input.getLanguageId());
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
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, List<Judge0Submission>> requestBody = new HashMap<>();
        requestBody.put("submissions", submissions);

        HttpEntity<Map<String, List<Judge0Submission>>> request = new HttpEntity<>(requestBody, headers);
        String url = judge0Uri + "/submissions/batch?base64_encoded=false";

        ResponseEntity<List<Judge0Response>> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                request,
                new ParameterizedTypeReference<List<Judge0Response>>() {}
        );

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new RuntimeException("Failed to submit to Judge0");
        }

        return response.getBody();
    }

    private List<Submissions> createTestcases(List<Judge0Response> judge0Responses, Submission submission) {
        return judge0Responses.stream()
                .map(response -> {
                    Submissions testcase = new Submissions();
                    testcase.setSubmission(submission);
                    testcase.setToken(response.getToken());
                    testcase.setSourceCode(response.getSourceCode());
                    // Add later
                    return testcase;
                })
                .collect(Collectors.toList());
    }
}
