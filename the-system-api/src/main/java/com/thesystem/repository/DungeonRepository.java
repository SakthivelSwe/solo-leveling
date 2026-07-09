package com.thesystem.repository;

import com.thesystem.entity.Dungeon;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface DungeonRepository extends JpaRepository<Dungeon, Long> {
    Optional<Dungeon> findByPlayerIdAndWeekStart(Long playerId, LocalDate weekStart);
}

