package com.hust.hustforces.model.dto.coderoom;

import com.hust.hustforces.enums.LanguageId;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCodeRoomRequest {
    @NotBlank(message = "Room name is required")
    private String name;

    private String description;

    private String problemId;

    @NotNull(message = "Language is required")
    private LanguageId languageId;

    @Min(2)
    @Max(10)
    private int maxParticipants = 4;

    private boolean isPublic = false;

    private boolean allowVoiceChat = true;

    private boolean allowVideoChat = true;

    private boolean allowScreenShare = true;

    private String initialCode;
}