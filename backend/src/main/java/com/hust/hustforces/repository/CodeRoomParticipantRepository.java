package com.hust.hustforces.repository;

import com.hust.hustforces.enums.ParticipantStatus;
import com.hust.hustforces.model.entity.CodeRoomParticipant;
import org.hibernate.annotations.ParamDef;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CodeRoomParticipantRepository extends JpaRepository<CodeRoomParticipant, String> {
    Optional<CodeRoomParticipant> findByCodeRoomIdAndUserId(String codeRoomId, String userId);

    List<CodeRoomParticipant> findByCodeRoomIdAndStatus(String codeRoomId, ParticipantStatus status);

    List<CodeRoomParticipant> findByUserIdAndStatus(String userId, ParticipantStatus status);

    @Query("SELECT COUNT(p) FROM CodeRoomParticipant p WHERE p.codeRoomId = :codeRoomId AND p.status = 'ACTIVE'")
    int countActiveParticipants(@Param("codeRoomId") String codeRoomId);

    @Query("SELECT p FROM CodeRoomParticipant p WHERE p.status = 'ACTIVE' AND p.lastActivityAt < :inactiveTime")
    List<CodeRoomParticipant> findInactiveParticipants(@Param("inactiveTime") LocalDateTime inactiveTime);

    void deleteByCodeRoomIdAndUserId(String codeRoomId, String userId);
}
