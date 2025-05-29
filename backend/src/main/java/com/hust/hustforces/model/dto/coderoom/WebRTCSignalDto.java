package com.hust.hustforces.model.dto.coderoom;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebRTCSignalDto {
    private String type; // offer, answer, ice-candidate
    private String fromUserId;
    private String toUserId;
    private Object data;
}
