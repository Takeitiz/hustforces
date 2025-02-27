package com.hust.hustforces.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Judge0Submission {
    private int language_id;
    private String source_code;
    private String expected_output;
}
