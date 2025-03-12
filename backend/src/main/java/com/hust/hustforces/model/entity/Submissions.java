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
    private String source_code;

    @Column(name = "language_id")
    private Integer language_id;

    @Column(columnDefinition = "TEXT")
    private String stdin;

    @Column(name = "expected_output", columnDefinition = "TEXT")
    private String expected_output;

    @Column(columnDefinition = "TEXT")
    private String stdout;

    @Column(name = "status_id")
    private Integer status_id;

    @Column(name = "created_at")
    private LocalDateTime created_at;

    @Column(name = "finished_at")
    private LocalDateTime finished_at;

    @Column(precision = 10, scale = 2)
    private BigDecimal time;

    private Integer memory;

    @Column(columnDefinition = "TEXT")
    private String stderr;

    @Column(columnDefinition = "VARCHAR")
    private String token;

    @Column(name = "number_of_runs")
    private Integer number_of_runs;

    @Column(name = "cpu_time_limit", precision = 10, scale = 2)
    private BigDecimal cpu_time_limit;

    @Column(name = "cpu_extra_time", precision = 10, scale = 2)
    private BigDecimal cpu_extra_time;

    @Column(name = "wall_time_limit", precision = 10, scale = 2)
    private BigDecimal wall_time_limit;

    @Column(name = "memory_limit")
    private Integer memory_limit;

    @Column(name = "stack_limit")
    private Integer stack_limit;

    @Column(name = "max_processes_and_or_threads")
    private Integer max_processes_and_or_threads;

    @Column(name = "enable_per_process_and_thread_time_limit")
    private Boolean enable_per_process_and_thread_time_limit;

    @Column(name = "enable_per_process_and_thread_memory_limit")
    private Boolean enable_per_process_and_thread_memory_limit;

    @Column(name = "max_file_size")
    private Integer max_file_size;

    @Column(name = "compile_output", columnDefinition = "TEXT")
    private String compile_output;

    @Column(name = "exit_code")
    private Integer exit_code;

    @Column(name = "exit_signal")
    private Integer exit_signal;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "wall_time", precision = 10, scale = 2)
    private BigDecimal wall_time;

    @Column(name = "compiler_options", columnDefinition = "VARCHAR")
    private String compiler_options;

    @Column(name = "command_line_arguments", columnDefinition = "VARCHAR")
    private String command_line_arguments;

    @Column(name = "redirect_stderr_to_stdout")
    private Boolean redirect_stderr_to_stdout;

    @Column(name = "callback_url", columnDefinition = "VARCHAR")
    private String callback_url;

    @Column(name = "additional_files", columnDefinition = "BYTEA")
    private byte[] additional_files;

    @Column(name = "enable_network")
    private Boolean enable_network;

    @Column(name = "submissionId", columnDefinition = "TEXT")
    private String submissionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submissionId", insertable = false, updatable = false)
    private Submission submission;
}

