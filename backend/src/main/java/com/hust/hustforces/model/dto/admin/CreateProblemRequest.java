package com.hust.hustforces.model.dto.admin;

import com.hust.hustforces.enums.Difficulty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateProblemRequest {
    @NotBlank(message = "Problem title is required")
    private String title;

    @NotBlank(message = "Problem slug is required")
    private String slug;

    @NotNull(message = "Difficulty is required")
    private Difficulty difficulty;

    private boolean hidden = true;
}
