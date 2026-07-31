package com.thesystem.repository;

import com.thesystem.entity.DungeonBreak;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface DungeonBreakRepository extends JpaRepository<DungeonBreak, Long> {
    
    @Query("SELECT d FROM DungeonBreak d WHERE d.playerId = :playerId AND d.isCleared = false AND d.isFailed = false")
    List<DungeonBreak> findActiveBreaks(Long playerId);
}
