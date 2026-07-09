package com.thesystem.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "body_logs", uniqueConstraints = @UniqueConstraint(columnNames = {"player_id", "log_date"}))
@Getter
@Setter
public class BodyLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate = LocalDate.now();

    @Column(name = "testosterone_pillars")
    private int testosteronePillars = 0; // 0-7

    @Column(name = "cold_shower")
    private boolean coldShower = false;

    @Column(name = "morning_sun_min")
    private int morningSunMin = 0;

    @Column(name = "zinc_meal")
    private boolean zincMeal = false;

    @Column(name = "no_soda")
    private boolean noSoda = false;

    @Column(name = "no_porn")
    private boolean noPorn = false;

    @Column(name = "exercise_done")
    private boolean exerciseDone = false;

    @Column(name = "slept_before_1130")
    private boolean sleptBefore1130 = false;
}

