package com.hust.hustforces.repository;

import com.hust.hustforces.model.entity.Contest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ContestRepository extends JpaRepository<Contest, String> {

    @Query("SELECT c FROM Contest c WHERE c.id = :contestId AND c.hidden = false")
    Optional<Contest> findByIdAndHiddenFalse(@Param("contestId") String contestId);
}
