package com.hust.hustforces.model.entity;

import com.hust.hustforces.enums.CodeRoomStatus;
import com.hust.hustforces.enums.LanguageId;
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
@Table(name = "code_rooms")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodeRoom extends BaseEntity {
    @Id
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.TIME)
    private String id;

    @Column(nullable = false, unique = true)
    private String roomCode;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "problem_id")
    private String problemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Problem problem;

    @Column(name = "contest_id")
    private String contestId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contest_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Contest contest;

    @Column(name = "host_user_id", nullable = false)
    private String hostUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_user_id", referencedColumnName = "id", insertable = false, updatable = false)
    private User hostUser;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CodeRoomStatus status = CodeRoomStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(name = "language_id", nullable = false)
    private LanguageId languageId;

    @Column(columnDefinition = "TEXT")
    private String currentCode;

    @Column(name = "max_participants")
    private int maxParticipants = 4;

    @Column(name = "is_public")
    private boolean isPublic = false;

    @Column(name = "allow_voice_chat")
    private boolean allowVoiceChat = true;

    @Column(name = "allow_video_chat")
    private boolean allowVideoChat = true;

    @Column(name = "allow_screen_share")
    private boolean allowScreenShare = true;

    @OneToMany(mappedBy = "codeRoom", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CodeRoomParticipant> participants = new ArrayList<>();

    @OneToMany(mappedBy = "codeRoom", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CodeRoomSession> sessions = new ArrayList<>();

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "last_activity_at")
    private LocalDateTime lastActivityAt;

    @Lob
    @Basic(fetch=FetchType.LAZY)
    @Column(name = "yjs_document", columnDefinition = "BYTEA")
    private byte[] yjsDocument; // Store Yjs document state
}
