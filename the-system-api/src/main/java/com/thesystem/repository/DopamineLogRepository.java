package com.thesystem.repository;

import com.thesystem.entity.DopamineLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DopamineLogRepository extends JpaRepository<DopamineLog, Long> {
    Optional<DopamineLog> findByPlayerIdAndLogDate(Long playerId, LocalDate date);
    List<DopamineLog> findByPlayerIdOrderByLogDateDesc(Long playerId);
    List<DopamineLog> findByPlayerIdAndLogDateBetweenOrderByLogDateDesc(Long playerId, LocalDate start, LocalDate end);
}
