package com.hust.hustforces.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class Judge0Submission {
    @JsonProperty("language_id")
    private Integer languageId;

    @JsonProperty("source_code")
    private String sourceCode;

    @JsonProperty("expected_output")
    private String expectedOutput;

    @JsonProperty("callback_url")
    private String callbackUrl;

    public Judge0Submission(Integer languageId, String sourceCode, String expectedOutput, String baseUrl, String submissionId) {
        this.languageId = languageId;
        this.sourceCode = sourceCode;
        this.expectedOutput = expectedOutput;
        this.callbackUrl = baseUrl + "/api/callback/" + submissionId;
    }

    public Judge0Submission(Integer languageId, String sourceCode, String expectedOutput) {
        this.languageId = languageId;
        this.sourceCode = sourceCode;
        this.expectedOutput = expectedOutput;
    }
}
