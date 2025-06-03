package com.hust.hustforces.model.dto.coderoom;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MediaStateDto {
    private boolean isMuted;
    private boolean isVideoOn;
    private boolean isScreenSharing;
}
