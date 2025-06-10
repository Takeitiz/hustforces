package com.hust.hustforces.model.dto.problem;

import com.hust.hustforces.enums.Difficulty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProblemDetailDto {
    private String id;
    private String title;
    private String description;
    private boolean hidden = true;
    private String slug;
    private int solved = 0;
    private Difficulty difficulty = Difficulty.MEDIUM;

    @Builder.Default
    private List<DefaultCodeDto> defaultCode = new ArrayList<>();

    @Builder.Default
    private List<ContestSubmissionDto> contestSubmissions = new ArrayList<>();

    @Builder.Default
    private List<ContestProblemDto> contests = new ArrayList<>();

    @Builder.Default
    private List<SubmissionDto> submissions = new ArrayList<>();
}
