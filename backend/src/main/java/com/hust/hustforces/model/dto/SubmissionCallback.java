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
        private StatusDescription description;

        @Getter
        public enum StatusDescription {
            ACCEPTED("Accepted"),
            REJECTED("Rejected"),
            RUNTIME_ERROR_NZEC("Runtime Error (NZEC)"),
            COMPILATION_ERROR("Compilation Error"),
            TIME_LIMIT_EXCEEDED("Time Limit Exceeded"),
            MEMORY_LIMIT_EXCEEDED("Memory Limit Exceeded"),
            WRONG_ANSWER("Wrong Answer");

            private final String value;

            StatusDescription(String value) {
                this.value = value;
            }
        }
    }
}
