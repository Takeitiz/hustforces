package com.hust.hustforces.service.impl;

import com.hust.hustforces.model.dto.Judge0Response;
import com.hust.hustforces.model.dto.Judge0Submission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.retry.support.RetryTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class Judge0Client {

    private final RestTemplate restTemplate;
    private final RetryTemplate retryTemplate;
    @Value("${judge0.uri}")
    private String judge0Uri;

    public List<Judge0Response> submitBatch(List<Judge0Submission> submissions) {
        return retryTemplate.execute(context -> {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> requestMap = new HashMap<>();
            requestMap.put("submissions", submissions);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestMap, headers);
            String url = judge0Uri + "/submissions/batch?base64_encoded=false";

            log.info("Submitting batch of {} submissions to Judge0, attempt: {}",
                    submissions.size(), context.getRetryCount() + 1);

            ResponseEntity<List<Judge0Response>> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    request,
                    new ParameterizedTypeReference<List<Judge0Response>>() {}
            );

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new RuntimeException("Failed to submit to Judge0: " + response.getStatusCode());
            }

            log.info("Successfully submitted batch of {} submissions to Judge0", submissions.size());
            return response.getBody();
        });
    }

    public Judge0Response getSubmissionStatus(String token) {
        return retryTemplate.execute(context -> {
            String url = judge0Uri + "/submissions/" + token + "?base64_encoded=false";

            log.debug("Checking status for submission token: {}, attempt: {}",
                    token, context.getRetryCount() + 1);

            ResponseEntity<Judge0Response> response = restTemplate.getForEntity(
                    url, Judge0Response.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Failed to get submission status: " + response.getStatusCode());
            }

            return response.getBody();
        });
    }
}
