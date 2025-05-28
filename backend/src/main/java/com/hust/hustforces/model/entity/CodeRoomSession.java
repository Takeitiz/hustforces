package com.hust.hustforces.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;

@Entity
@Table(name = "code_room_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodeRoomSession extends BaseEntity {
    @Id
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.TIME)
    private String id;

    @Column(name = "code_room_id", nullable = false)
    private String codeRoomId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "code_room_id", referencedColumnName = "id", insertable = false, updatable = false)
    private CodeRoom codeRoom;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "final_code", columnDefinition = "TEXT")
    private String finalCode;

    @Column(name = "submission_id")
    private String submissionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Submission submission;

    @Column(name = "total_edits")
    private Integer totalEdits = 0;

    @Column(name = "participants_count")
    private Integer participantsCount = 0;

    @Column(name = "recording_url")
    private String recordingUrl;
}
