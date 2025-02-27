package com.hust.hustforces.repository;

import com.hust.hustforces.model.entity.DefaultCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DefaultCodeRepository extends JpaRepository<DefaultCode, String> {
    Optional<DefaultCode> findByProblemIdAndLanguageId(String problemId, Integer languageId);
}
