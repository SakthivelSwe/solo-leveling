package com.thesystem.repository;

import com.thesystem.entity.AiMemoryEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface AiMemoryRepository extends JpaRepository<AiMemoryEntry, Long> {
    List<AiMemoryEntry> findByPlayerIdOrderByWeekStartDesc(Long playerId);
    List<AiMemoryEntry> findByPlayerIdAndWeekStartGreaterThanEqualOrderByWeekStartDesc(
            Long playerId, LocalDate since);

    /** Deletes memory entries older than 4 weeks to keep the rolling window clean. */
    @Modifying
    @Query("DELETE FROM AiMemoryEntry m WHERE m.playerId = :playerId AND m.weekStart < :cutoff")
    void deleteOlderThan(@Param("playerId") Long playerId, @Param("cutoff") LocalDate cutoff);
}
