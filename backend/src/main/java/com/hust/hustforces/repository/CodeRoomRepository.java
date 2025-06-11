package com.hust.hustforces.repository;

import com.hust.hustforces.enums.CodeRoomStatus;
import com.hust.hustforces.model.entity.CodeRoom;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CodeRoomRepository extends JpaRepository<CodeRoom, String> {
    Optional<CodeRoom> findByRoomCode(String roomCode);

    boolean existsByRoomCode(String roomCode);

    @Query("SELECT cr FROM CodeRoom cr WHERE cr.hostUserId = :userId AND cr.status = :status")
    List<CodeRoom> findByHostUserIdAndStatus(@Param("userId") String userId, @Param("status") CodeRoomStatus status);

    Page<CodeRoom> findByStatusAndIsPublicOrderByCreatedAtDesc(CodeRoomStatus status, boolean isPublic, Pageable pageable);

    @Query("SELECT cr FROM CodeRoom cr WHERE cr.status = 'ACTIVE' AND cr.lastActivityAt < :inactiveTime")
    List<CodeRoom> findInactiveRooms(@Param("inactiveTime") LocalDateTime inactiveTime);

    @Query("SELECT COUNT(cr) FROM CodeRoom cr WHERE cr.status = 'ACTIVE'")
    long countActiveRooms();
}