package com.hust.hustforces.model.dto.coderoom;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CodeSubmittedEvent {
    private String submissionId;
    private String userId;
}
