package com.hust.hustforces.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_stats")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserStats extends BaseEntity {
    @Id
    private String userId;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id", insertable = false, updatable = false)
    private User user;

    private int totalSubmissions;
    private int acceptedSubmissions;
    private int problemsSolved;
    private int contests;
    private int currentRank;
    private int maxRank;

    @Column(columnDefinition = "TEXT")
    private String problemsByDifficultyJson;

    @Column(columnDefinition = "TEXT")
    private String submissionCalendarJson;

    // Many users might look at profiles that haven't been updated recently
    // This timestamp helps us prioritize which stats to update first
    private LocalDateTime lastCalculated;

    @Column(name = "rating_change")
    private Integer ratingChange = 0;
}