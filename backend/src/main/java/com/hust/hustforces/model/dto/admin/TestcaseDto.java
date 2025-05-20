package com.hust.hustforces.model.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestcaseDto {
    private String id;
    private String input;
    private String output;
    private String explanation;
}