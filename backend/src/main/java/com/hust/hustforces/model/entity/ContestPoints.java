package com.hust.hustforces.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;

@Entity
@Table(name = "contest_points",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"contest_id", "user_id"})
        },
        indexes = {
                @Index(name = "idx_contest_rank", columnList = "contest_id, rank"),
                @Index(name = "idx_contest_points", columnList = "contest_id, points DESC, last_submission_time")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContestPoints extends BaseEntity {
    @Id
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.TIME)
    private String id;

    @Column(name = "contest_id", nullable = false)
    private String contestId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(nullable = false)
    private int points = 0;

    @Column(nullable = false)
    private int rank = 0;

    @Column(name = "problems_solved")
    private int problemsSolved = 0;

    @Column(name = "total_attempts")
    private int totalAttempts = 0;

    @Column(name = "last_submission_time")
    private LocalDateTime lastSubmissionTime;

    @Column(name = "problem_details", columnDefinition = "TEXT")
    private String problemDetailsJson;

    @Column(name = "rating_before")
    private Integer ratingBefore;

    @Column(name = "rating_after")
    private Integer ratingAfter;

    @Column(name = "rating_change")
    private Integer ratingChange;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", insertable = false, updatable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contest_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Contest contest;
}
