package com.hust.hustforces.model.dto.coderoom;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserMediaStateEvent {
    private String userId;
    private MediaStateDto mediaState;
}
