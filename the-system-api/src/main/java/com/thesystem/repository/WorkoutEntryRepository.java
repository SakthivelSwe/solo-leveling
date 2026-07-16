package com.thesystem.repository;

import com.thesystem.entity.WorkoutEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkoutEntryRepository extends JpaRepository<WorkoutEntry, Long> {
    List<WorkoutEntry> findByPlayerIdOrderByWorkoutDateDescIdDesc(Long playerId);
}

