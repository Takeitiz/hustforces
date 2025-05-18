package com.hust.hustforces.model.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoilerplateGenerationResponseDto {
    private boolean success;
    private String message;
    private List<String> generatedFiles;
}
