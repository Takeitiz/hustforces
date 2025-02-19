package com.hust.hustforces.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class ProblemDto {
    private String id;
    private String fullBoilerplateCode;
    private List<String> inputs;
    private List<String> outputs;
}
