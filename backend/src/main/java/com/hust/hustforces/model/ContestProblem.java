package com.hust.hustforces.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "contest_problems")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(ContestProblemId.class)
public class ContestProblem {
    @Id
    private String contestId;

    @Id
    private String problemId;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column(nullable = false)
    private int index;

    @Column(nullable = false)
    private int solved = 0;

    @ManyToOne
    @JoinColumn(name = "contest_id", insertable = false, updatable = false)
    private Contest contest;

    @ManyToOne
    @JoinColumn(name = "problem_id", insertable = false, updatable = false)
    private Problem problem;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
