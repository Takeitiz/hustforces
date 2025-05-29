package com.hust.hustforces.model.dto.coderoom;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebRTCConfigDto {
    private List<String> iceServers;
    private String stunServer;
    private String turnServer;
    private String turnUsername;
    private String turnCredential;
}