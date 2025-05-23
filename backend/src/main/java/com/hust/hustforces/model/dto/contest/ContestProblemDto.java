package com.hust.hustforces.model.dto.contest;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContestProblemDto {
    @NotBlank(message = "Problem ID cannot be blank")
    private String problemId;

    private int index;
}
