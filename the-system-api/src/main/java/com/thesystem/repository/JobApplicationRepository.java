package com.thesystem.repository;

import com.thesystem.entity.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {
    List<JobApplication> findByPlayerIdOrderByAppliedDateDesc(Long playerId);
    long countByPlayerId(Long playerId);
    long countByPlayerIdAndStatus(Long playerId, String status);
}

