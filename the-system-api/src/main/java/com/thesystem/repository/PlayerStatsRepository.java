package com.thesystem.repository;

import com.thesystem.entity.PlayerStats;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PlayerStatsRepository extends JpaRepository<PlayerStats, Long> {
    Optional<PlayerStats> findByPlayerId(Long playerId);
}

