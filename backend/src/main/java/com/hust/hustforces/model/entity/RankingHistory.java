package com.hust.hustforces.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "ranking_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RankingHistory extends BaseEntity {
    @Id
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.TIME)
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", insertable = false, updatable = false)
    private User user;

    @Column(name = "contest_id", nullable = false)
    private String contestId;

    @Column(nullable = false)
    private String contestName;

    @Column(nullable = false)
    private int rank;

    @Column(nullable = false)
    private int rating;

    @Column(nullable = false)
    private int ratingChange;
}
