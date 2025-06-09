package com.hust.hustforces.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "Contest", indexes = {
        @Index(name = "idx_contest_hidden_start", columnList = "hidden, start_time DESC"),
        @Index(name = "idx_contest_times", columnList = "start_time, end_time"),
        @Index(name = "idx_contest_title", columnList = "title")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Contest extends BaseEntity {

    @Id
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.TIME)
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDateTime startTime;

    @Column(nullable = false)
    private LocalDateTime endTime;

    @Column(nullable = false)
    private boolean hidden = true;

    @Column(nullable = false)
    private boolean leaderboard = false;

    @OneToMany(mappedBy = "activeContest", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Submission> submissions = new ArrayList<>();

    @OneToMany(mappedBy = "contest", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<ContestProblem> problems = new ArrayList<>();

    @OneToMany(mappedBy = "contest", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<ContestSubmission> contestSubmissions = new ArrayList<>();

}
