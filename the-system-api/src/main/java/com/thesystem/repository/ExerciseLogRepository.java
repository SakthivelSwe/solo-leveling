package com.thesystem.repository;

import com.thesystem.entity.ExerciseLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExerciseLogRepository extends JpaRepository<ExerciseLog, Long> {
    List<ExerciseLog> findByPlayerIdOrderByExerciseDateDesc(Long playerId);
}

