package com.thesystem.repository;

import com.thesystem.entity.SavingsGoal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SavingsGoalRepository extends JpaRepository<SavingsGoal, Long> {
    List<SavingsGoal> findByPlayerIdOrderByDeadlineAsc(Long playerId);
    long countByPlayerId(Long playerId);
}

