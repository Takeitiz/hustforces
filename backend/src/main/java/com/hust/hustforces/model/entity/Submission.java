package com.hust.hustforces.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.hust.hustforces.enums.LanguageId;
import com.hust.hustforces.enums.SubmissionResult;
import com.hust.hustforces.enums.SubmissionState;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "Submission")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Submission extends BaseEntity {

    @Id
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.TIME)
    private String id;

    @Column(name = "problem_id", nullable = false)
    private String problemId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "language_id", nullable = false)
    private LanguageId languageId;

    @Column(name = "active_contest_id")
    private String activeContestId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "active_contest_id", insertable = false, updatable = false)
    private Contest activeContest;

    @OneToOne(mappedBy = "submission")
    private ContestSubmission contestSubmission;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubmissionResult status = SubmissionResult.PENDING;

    private int memory;

    private double time;

    @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL)
    private List<TestCase> testcases;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", insertable = false, updatable = false)
    @JsonIgnore
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id", referencedColumnName = "id", insertable = false, updatable = false)
    @JsonIgnore
    private Problem problem;

    @Enumerated(EnumType.STRING)
    @Column(name = "state")
    private SubmissionState state = SubmissionState.CREATED;

    @Column(name = "processing_attempts")
    private int processingAttempts = 0;

    @Column(name = "contest_processing_error")
    private String contestProcessingError;
}
