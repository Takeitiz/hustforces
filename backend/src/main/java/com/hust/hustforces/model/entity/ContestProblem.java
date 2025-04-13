package com.hust.hustforces.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "ContestProblem")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(ContestProblemId.class)
public class ContestProblem extends BaseEntity {
    @Id
    @Column(name = "contest_id")
    private String contestId;

    @Id
    @Column(name = "problem_id")
    private String problemId;

    @Column(nullable = false)
    private String id;

    @Column(nullable = false)
    private int index;

    @Column(nullable = false)
    private int solved = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contest_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Contest contest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Problem problem;
}
