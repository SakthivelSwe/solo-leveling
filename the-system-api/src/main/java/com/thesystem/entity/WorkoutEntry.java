package com.thesystem.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/**
 * Phase 4 — a single detailed workout entry: one exercise with its sets, reps
 * and (optional) weight. Multiple entries per day form a full workout. This
 * replaces the old yes/no exercise checkbox with real strength-training logs.
 */
@Entity
@Table(name = "workout_entries", indexes = @Index(name = "idx_workout_player", columnList = "player_id"))
@Getter
@Setter
public class WorkoutEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(name = "workout_date", nullable = false)
    private LocalDate workoutDate = LocalDate.now();

    @Column(name = "exercise_name", nullable = false, length = 120)
    private String exerciseName;

    private int sets = 0;
    private int reps = 0;

    /** Optional load in kilograms (null / 0 for bodyweight exercises). */
    @Column(name = "weight_kg")
    private Double weightKg;

    @Column(length = 300)
    private String notes;
}

