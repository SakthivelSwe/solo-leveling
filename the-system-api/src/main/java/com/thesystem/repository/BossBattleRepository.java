package com.thesystem.repository;

import com.thesystem.entity.BossBattle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BossBattleRepository extends JpaRepository<BossBattle, Long> {
    List<BossBattle> findByPlayerIdOrderByStartedAtDesc(Long playerId);
    long countByPlayerIdAndScoreGreaterThanEqual(Long playerId, int minScore);
}

