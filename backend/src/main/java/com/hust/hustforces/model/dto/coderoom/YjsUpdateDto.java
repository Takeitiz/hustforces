package com.hust.hustforces.model.dto.coderoom;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class YjsUpdateDto {
    private String senderSessionId; // To identify the sender and avoid echoing back
    private byte[] update; // Yjs update binary
}
