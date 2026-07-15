package com.thesystem.repository;

import com.thesystem.entity.DeepWorkSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface DeepWorkSessionRepository extends JpaRepository<DeepWorkSession, Long> {
    List<DeepWorkSession> findByPlayerIdAndSessionDateBetweenOrderBySessionDateDesc(
            Long playerId, LocalDate start, LocalDate end);
    List<DeepWorkSession> findByPlayerIdOrderBySessionDateDesc(Long playerId);

    @Query("SELECT COALESCE(SUM(d.codingMinutes), 0) FROM DeepWorkSession d WHERE d.playerId = :playerId")
    int sumCodingMinutesByPlayerId(@Param("playerId") Long playerId);

    @Query("SELECT COALESCE(SUM(d.focusXpEarned), 0) FROM DeepWorkSession d WHERE d.playerId = :playerId")
    int sumFocusXpByPlayerId(@Param("playerId") Long playerId);
}
