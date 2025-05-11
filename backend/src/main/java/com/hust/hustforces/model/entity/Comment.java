package com.hust.hustforces.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "comments", indexes = {
        @Index(name = "idx_comments_path", columnList = "path"),
        @Index(name = "idx_comments_parent_id", columnList = "parent_id"),
        @Index(name = "idx_comments_discussion_id_parent_id", columnList = "discussion_id, parent_id"),
        @Index(name = "idx_comments_solution_id_parent_id", columnList = "solution_id, parent_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Comment extends BaseEntity {
    @Id
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.TIME)
    private String id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", insertable = false, updatable = false)
    private User user;

    @Column(name = "discussion_id")
    private String discussionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "discussion_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Discussion discussion;

    @Column(name = "solution_id")
    private String solutionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "solution_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Solution solution;

    @Column(name = "parent_id")
    private String parentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Comment parent;

    @Column(nullable = false)
    private int upvotes = 0;

    @Column(nullable = false)
    private int downvotes = 0;

    @Column(name = "path", nullable = false, columnDefinition = "VARCHAR(1000) DEFAULT '/'")
    private String path = "/";

    @Column(name = "level", nullable = false)
    private int level = 0;

    @Column(name = "reply_count", nullable = false)
    private int replyCount = 0;
}