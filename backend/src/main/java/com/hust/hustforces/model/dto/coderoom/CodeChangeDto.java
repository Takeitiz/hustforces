package com.hust.hustforces.model.dto.coderoom;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeChangeDto {
    private String userId;
    private String changeId;
    private String operation; // insert, delete, replace
    private int startLine;
    private int startColumn;
    private int endLine;
    private int endColumn;
    private String text;
    private long timestamp;
}
