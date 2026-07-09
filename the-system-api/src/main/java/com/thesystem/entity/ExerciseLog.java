package com.thesystem.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "exercise_logs")
@Getter
@Setter
public class ExerciseLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(name = "exercise_date", nullable = false)
    private LocalDate exerciseDate = LocalDate.now();

    @Column(name = "exercise_type")
    private String exerciseType;

    @Column(name = "squats_sets")
    private int squatsSets = 0;
    @Column(name = "squats_reps")
    private int squatsReps = 0;
    @Column(name = "pushups_sets")
    private int pushupsSets = 0;
    @Column(name = "pushups_reps")
    private int pushupsReps = 0;
    @Column(name = "plank_seconds")
    private int plankSeconds = 0;
    @Column(name = "duration_min")
    private int durationMin = 0;

    @Column(length = 500)
    private String notes;
}

