package com.thesystem.repository;

import com.thesystem.entity.MindLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MindLogRepository extends JpaRepository<MindLog, Long> {
    List<MindLog> findByPlayerIdOrderByLogDateDesc(Long playerId);
    Optional<MindLog> findByPlayerIdAndLogDate(Long playerId, LocalDate logDate);
}

