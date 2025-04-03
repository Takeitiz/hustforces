package com.hust.hustforces.model.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SubmissionCallback {
    private String stdout;
    private String time;
    private int memory;
    private String stderr;

    @NotNull
    private String token;
    private String compileOutput;
    private String message;

    @NotNull
    private Status status;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Status {
        @NotNull
        private int id;

        @NotNull
        private String description;
    }
}
