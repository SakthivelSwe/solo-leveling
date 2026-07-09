package com.thesystem.repository;

import com.thesystem.entity.HabitCompletion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface HabitCompletionRepository extends JpaRepository<HabitCompletion, Long> {
    List<HabitCompletion> findByPlayerIdAndCompletedAt(Long playerId, LocalDate date);
    List<HabitCompletion> findByHabitIdOrderByCompletedAtDesc(Long habitId);
    List<HabitCompletion> findByPlayerIdAndCompletedAtBetween(Long playerId, LocalDate start, LocalDate end);
    boolean existsByPlayerIdAndHabitIdAndCompletedAt(Long playerId, Long habitId, LocalDate date);
    long countByPlayerId(Long playerId);
    long countByHabitId(Long habitId);
}

