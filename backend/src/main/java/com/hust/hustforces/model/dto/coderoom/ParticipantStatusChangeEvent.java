package com.hust.hustforces.model.dto.coderoom;

import com.hust.hustforces.enums.ParticipantStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ParticipantStatusChangeEvent {
    private String userId;
    private ParticipantStatus newStatus;
}
