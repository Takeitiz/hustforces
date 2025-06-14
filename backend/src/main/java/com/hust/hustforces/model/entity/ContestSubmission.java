package com.hust.hustforces.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "ContestSubmission",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_user_problem_contest",
                        columnNames = {"user_id", "problem_id", "contest_id"}
                )
        },
        indexes = {
                @Index(name = "idx_contest_user", columnList = "contest_id, user_id"),
                @Index(name = "idx_contest_submission_points", columnList = "contest_id, points DESC")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContestSubmission extends BaseEntity {
    @Id
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.TIME)
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "problem_id", nullable = false)
    private String problemId;

    @Column(name = "contest_id", nullable = false)
    private String contestId;

    @Column(name = "submission_id", nullable = false)
    private String submissionId;

    @OneToOne
    @JoinColumn(name = "submission_id", insertable = false, updatable = false)
    private Submission submission;

    @Column(nullable = false)
    private int points;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", insertable = false, updatable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Problem problem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contest_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Contest contest;
}
