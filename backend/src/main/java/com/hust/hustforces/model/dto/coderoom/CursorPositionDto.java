package com.hust.hustforces.model.dto.coderoom;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CursorPositionDto {
    private int line;
    private int column;
    private Integer selectionStartLine;
    private Integer selectionStartColumn;
    private Integer selectionEndLine;
    private Integer selectionEndColumn;
}
