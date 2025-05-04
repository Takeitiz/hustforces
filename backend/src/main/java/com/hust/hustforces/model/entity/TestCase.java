package com.hust.hustforces.model.entity;

import com.hust.hustforces.enums.TestCaseProcessingState;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "test_cases")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestCase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "submission_id")
    private String submissionId;

    @Column(name = "test_index")
    private Integer testIndex;

    @Column(name = "status_id")
    private Integer statusId;

    @Column(columnDefinition = "TEXT")
    private String stdin;

    @Column(columnDefinition = "TEXT")
    private String stdout;

    @Column(columnDefinition = "VARCHAR")
    private String token;

    @Column(name = "expected_output", columnDefinition = "TEXT")
    private String expectedOutput;

    @Column(columnDefinition = "TEXT")
    private String stderr;

    @Column(precision = 10, scale = 2)
    private BigDecimal executionTime;

    private Integer memoryUsed;

    @Column(name = "error_details", columnDefinition = "TEXT")
    private String errorDetails;

    @Enumerated(EnumType.STRING)
    @Column(name = "processing_state")
    private TestCaseProcessingState processingState = TestCaseProcessingState.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", insertable = false, updatable = false)
    private Submission submission;
}
