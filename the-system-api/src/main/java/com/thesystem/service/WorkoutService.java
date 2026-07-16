package com.thesystem.service;

import com.thesystem.entity.WorkoutEntry;
import com.thesystem.repository.WorkoutEntryRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

/**
 * Phase 4 — Workout logger: detailed exercise/sets/reps/weight entries.
 */
@Service
public class WorkoutService {

    private final WorkoutEntryRepository repo;

    public WorkoutService(WorkoutEntryRepository repo) {
        this.repo = repo;
    }

    public WorkoutEntry add(Long playerId, WorkoutEntry body) {
        body.setId(null);
        body.setPlayerId(playerId);
        if (body.getWorkoutDate() == null) body.setWorkoutDate(LocalDate.now());
        if (body.getExerciseName() != null) body.setExerciseName(body.getExerciseName().trim());
        return repo.save(body);
    }

    public List<WorkoutEntry> history(Long playerId) {
        return repo.findByPlayerIdOrderByWorkoutDateDescIdDesc(playerId);
    }

    /** Deletes an entry only if it belongs to the requesting player. */
    public void delete(Long playerId, Long id) {
        repo.findById(id)
                .filter(w -> w.getPlayerId().equals(playerId))
                .ifPresent(repo::delete);
    }
}

