package com.hust.hustforces.model.dto.admin;

import com.hust.hustforces.enums.Difficulty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProblemRequest {
    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotBlank(message = "Structure is required")
    private String structure;

    @NotNull(message = "Difficulty is required")
    private Difficulty difficulty;

    private List<TestcaseUpdateDto> testcases;

    private boolean hidden;
}
