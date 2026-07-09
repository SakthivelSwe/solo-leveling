package com.thesystem.repository;

import com.thesystem.entity.HealthLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface HealthLogRepository extends JpaRepository<HealthLog, Long> {
    List<HealthLog> findByPlayerIdOrderByLogDateDesc(Long playerId);
    Optional<HealthLog> findByPlayerIdAndLogDate(Long playerId, LocalDate logDate);
}

