package com.hust.hustforces.model.dto.coderoom;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserTypingEvent {
    private String userId;
    private boolean isTyping;
}
