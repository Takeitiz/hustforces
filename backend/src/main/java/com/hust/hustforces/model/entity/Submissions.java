package com.hust.hustforces.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "submissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Submissions {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "source_code", columnDefinition = "TEXT")
    private String sourceCode;

    @Column(name = "language_id")
    private Integer languageId;

    @Column(columnDefinition = "TEXT")
    private String stdin;

    @Column(name = "expected_output", columnDefinition = "TEXT")
    private String expectedOutput;

    @Column(columnDefinition = "TEXT")
    private String stdout;

    @Column(name = "status_id")
    private Integer statusId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Column(precision = 10, scale = 2)
    private BigDecimal time;

    private Integer memory;

    @Column(columnDefinition = "TEXT")
    private String stderr;

    @Column(columnDefinition = "VARCHAR")
    private String token;

    @Column(name = "number_of_runs")
    private Integer numberOfRuns;

    @Column(name = "cpu_time_limit", precision = 10, scale = 2)
    private BigDecimal cpuTimeLimit;

    @Column(name = "cpu_extra_time", precision = 10, scale = 2)
    private BigDecimal cpuExtraTime;

    @Column(name = "wall_time_limit", precision = 10, scale = 2)
    private BigDecimal wallTimeLimit;

    @Column(name = "memory_limit")
    private Integer memoryLimit;

    @Column(name = "stack_limit")
    private Integer stackLimit;

    @Column(name = "max_processes_and_or_threads")
    private Integer maxProcessesAndOrThreads;

    @Column(name = "enable_per_process_and_thread_time_limit")
    private Boolean enablePerProcessAndThreadTimeLimit;

    @Column(name = "enable_per_process_and_thread_memory_limit")
    private Boolean enablePerProcessAndThreadMemoryLimit;

    @Column(name = "max_file_size")
    private Integer maxFileSize;

    @Column(name = "compile_output", columnDefinition = "TEXT")
    private String compileOutput;

    @Column(name = "exit_code")
    private Integer exitCode;

    @Column(name = "exit_signal")
    private Integer exitSignal;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "wall_time", precision = 10, scale = 2)
    private BigDecimal wallTime;

    @Column(name = "compiler_options", columnDefinition = "VARCHAR")
    private String compilerOptions;

    @Column(name = "command_line_arguments", columnDefinition = "VARCHAR")
    private String commandLineArguments;

    @Column(name = "redirect_stderr_to_stdout")
    private Boolean redirectStderrToStdout;

    @Column(name = "callback_url", columnDefinition = "VARCHAR")
    private String callbackUrl;

    @Lob
    @Column(name = "additional_files")
    private byte[] additionalFiles;

    @Column(name = "enable_network")
    private Boolean enableNetwork;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", referencedColumnName = "id")
    private Submission submission;
}
