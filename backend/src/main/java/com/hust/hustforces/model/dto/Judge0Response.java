package com.hust.hustforces.model.dto;

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
    private String source_code;
    private Integer language_id;
    private String compiler_options;
    private String command_line_arguments;
    private String stdin;
    private String expected_output;
    private BigDecimal cpu_time_limit;
    private BigDecimal cpu_extra_time;
    private BigDecimal wall_time_limit;
    private Integer memory_limit;
    private Integer stack_limit;
    private Integer max_processes_and_or_threads;
    private Boolean enable_per_process_and_thread_time_limit;
    private Boolean enable_per_process_and_thread_memory_limit;
    private Integer max_file_size;
    private Boolean redirect_stderr_to_stdout;
    private Boolean enable_network;
    private Integer number_of_runs;
    private byte[] additional_files;
    private String callback_url;
    private String stdout;
    private String stderr;
    private String compile_output;
    private String message;
    private Integer exit_code;
    private Integer exit_signal;
    private Status status;
    private LocalDateTime created_at;
    private LocalDateTime finished_at;
    private String token;
    private BigDecimal time;
    private BigDecimal wall_time;
    private Integer memory;
}
