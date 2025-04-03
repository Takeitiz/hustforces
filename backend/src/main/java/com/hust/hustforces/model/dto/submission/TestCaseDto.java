package com.hust.hustforces.model.dto.submission;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestCaseDto {
    private Long id;
    private Integer status_id;
    private String stdin;
    private String stdout;
    private String expected_output;
    private String stderr;
    private Double time;
    private Integer memory;
}
