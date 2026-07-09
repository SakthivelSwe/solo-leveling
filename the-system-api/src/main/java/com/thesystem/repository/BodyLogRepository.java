package com.thesystem.repository;

import com.thesystem.entity.BodyLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BodyLogRepository extends JpaRepository<BodyLog, Long> {
    List<BodyLog> findByPlayerIdOrderByLogDateDesc(Long playerId);
    Optional<BodyLog> findByPlayerIdAndLogDate(Long playerId, LocalDate logDate);
}

