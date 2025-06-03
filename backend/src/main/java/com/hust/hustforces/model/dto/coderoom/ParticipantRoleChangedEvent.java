package com.hust.hustforces.model.dto.coderoom;

import com.hust.hustforces.enums.ParticipantRole;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ParticipantRoleChangedEvent {
    private String userId;
    private ParticipantRole oldRole;
    private ParticipantRole newRole;
}
