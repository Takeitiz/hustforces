package com.hust.hustforces.model.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestCaseUploadResponseDto {
    private int index;
    private String inputFileName;
    private String outputFileName;
    private long inputSize;
    private long outputSize;
    private boolean success;
    private String message;
}
