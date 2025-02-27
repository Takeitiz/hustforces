package com.hust.hustforces.model.dto;

import com.hust.hustforces.enums.LanguageId;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SubmissionInput {
    @NotBlank(message = "Code cannot be empty")
    private String code;

    @NotNull(message = "Language ID is required")
    private LanguageId languageId;

    @NotBlank(message = "Problem ID cannot be empty")
    private String problemId;

    private String activeContestId;

    @NotBlank(message = "Token cannot be empty")
    private String token;
}
