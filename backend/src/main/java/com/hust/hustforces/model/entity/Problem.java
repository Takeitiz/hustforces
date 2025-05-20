package com.hust.hustforces.model.entity;

import com.hust.hustforces.enums.Difficulty;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "Problem")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Problem extends BaseEntity{

    @Id
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.TIME)
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private boolean hidden = true;

    @Column(unique = true, nullable = false)
    private String slug;

    @Column(nullable = false)
    private int solved = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Difficulty difficulty = Difficulty.MEDIUM;

    @OneToMany(mappedBy = "problem", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DefaultCode> defaultCode = new ArrayList<>();

    @OneToMany(mappedBy = "problem", cascade = CascadeType.ALL)
    private List<ContestSubmission> contestSubmissions = new ArrayList<>();

    @OneToMany(mappedBy = "problem", cascade = CascadeType.ALL)
    private List<ContestProblem> contests = new ArrayList<>();

    @OneToMany(mappedBy = "problem", cascade = CascadeType.ALL)
    private List<Submission> submissions = new ArrayList<>();
}
