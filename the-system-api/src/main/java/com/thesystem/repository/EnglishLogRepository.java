package com.thesystem.repository;

import com.thesystem.entity.EnglishLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface EnglishLogRepository extends JpaRepository<EnglishLog, Long> {
    List<EnglishLog> findByPlayerIdOrderByLogDateDesc(Long playerId);
    Optional<EnglishLog> findByPlayerIdAndLogDate(Long playerId, LocalDate logDate);
}

