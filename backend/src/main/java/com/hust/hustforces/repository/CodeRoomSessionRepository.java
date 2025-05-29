package com.hust.hustforces.repository;

import com.hust.hustforces.model.entity.CodeRoomSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CodeRoomSessionRepository extends JpaRepository<CodeRoomSession, String> {
    List<CodeRoomSession> findByCodeRoomIdOrderByStartedAtDesc(String codeRoomId);

    Optional<CodeRoomSession> findTopByCodeRoomIdAndEndedAtIsNullOrderByStartedAtDesc(String codeRoomId);

    @Query("SELECT SUM(s.durationMinutes) FROM CodeRoomSession s WHERE s.codeRoomId = :codeRoomId")
    Integer getTotalDurationByCodeRoomId(@Param("codeRoomId") String codeRoomId);

    @Query("SELECT s FROM CodeRoomSession s WHERE s.startedAt >= :startDate AND s.endedAt <= :endDate")
    List<CodeRoomSession> findSessionsInDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}
