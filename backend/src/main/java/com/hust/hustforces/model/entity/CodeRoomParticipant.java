package com.hust.hustforces.model.entity;

import com.hust.hustforces.enums.ParticipantRole;
import com.hust.hustforces.enums.ParticipantStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;


@Entity
@Table(name = "code_room_participants",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"code_room_id", "user_id"})
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodeRoomParticipant extends BaseEntity {
    @Id
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.TIME)
    private String id;

    @Column(name = "code_room_id", nullable = false)
    private String codeRoomId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "code_room_id", referencedColumnName = "id", insertable = false, updatable = false)
    private CodeRoom codeRoom;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", insertable = false, updatable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ParticipantRole role = ParticipantRole.COLLABORATOR;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ParticipantStatus status = ParticipantStatus.ACTIVE;

    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt;

    @Column(name = "left_at")
    private LocalDateTime leftAt;

    @Column(name = "cursor_position")
    private Integer cursorPosition;

    @Column(name = "selection_start")
    private Integer selectionStart;

    @Column(name = "selection_end")
    private Integer selectionEnd;

    @Column(name = "is_typing")
    private boolean isTyping = false;

    @Column(name = "last_activity_at")
    private LocalDateTime lastActivityAt;

    @Column(name = "color_hex")
    private String colorHex;

    @Column(name = "is_muted")
    private boolean isMuted = false;

    @Column(name = "is_video_on")
    private boolean isVideoOn = false;

    @Column(name = "is_screen_sharing")
    private boolean isScreenSharing = false;

    @Column(name = "peer_connection_id")
    private String peerConnectionId;
}