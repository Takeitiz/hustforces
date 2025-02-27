package com.hust.hustforces.model.dto;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Judge0Response {
    private Integer id;
    private String sourceCode;
    private Integer languageId;
    private String stdin;
    private String expectedOutput;
    private String stdout;
    private Integer statusId;
    private LocalDateTime createdAt;
    private LocalDateTime finishedAt;
    private BigDecimal time;
    private Integer memory;
    private String stderr;
    private String token;
    private Integer numberOfRuns;
    private BigDecimal cpuTimeLimit;
    private BigDecimal cpuExtraTime;
    private BigDecimal wallTimeLimit;
    private Integer memoryLimit;
    private Integer stackLimit;
    private Integer maxProcessesAndOrThreads;
    private Boolean enablePerProcessAndThreadTimeLimit;
    private Boolean enablePerProcessAndThreadMemoryLimit;
    private Integer maxFileSize;
    private String compileOutput;
    private Integer exitCode;
    private Integer exitSignal;
    private String message;
    private BigDecimal wallTime;
    private String compilerOptions;
    private String commandLineArguments;
    private Boolean redirectStderrToStdout;
    private String callbackUrl;
    private byte[] additionalFiles;
    private Boolean enableNetwork;
}
