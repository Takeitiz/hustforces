package com.hust.hustforces.repository;

import com.hust.hustforces.model.entity.Submissions;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubmissionsRepository extends JpaRepository<Submissions, Long> {
}