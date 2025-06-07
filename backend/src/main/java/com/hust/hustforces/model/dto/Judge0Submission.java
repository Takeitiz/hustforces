package com.hust.hustforces.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class Judge0Submission {
    @JsonProperty("language_id")
    private Integer language_id;

    @JsonProperty("source_code")
    private String source_code;

    @JsonProperty("expected_output")
    private String expected_output;

    @JsonProperty("callback_url")
    private String callback_url;

    public Judge0Submission(Integer languageId, String sourceCode, String expectedOutput, String baseUrl, String submissionId) {
        this.language_id = languageId;
        this.source_code = sourceCode;
        this.expected_output = expectedOutput;
        this.callback_url = baseUrl + "/api/callback/" + submissionId;
    }

    public Judge0Submission(Integer languageId, String sourceCode, String expectedOutput) {
        this.language_id = languageId;
        this.source_code = sourceCode;
        this.expected_output = expectedOutput;
    }
}
