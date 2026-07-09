package com.thesystem.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "health_logs", uniqueConstraints = @UniqueConstraint(columnNames = {"player_id", "log_date"}))
@Getter
@Setter
public class HealthLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate = LocalDate.now();

    @Column(name = "sleep_bedtime")
    private LocalTime sleepBedtime;

    @Column(name = "sleep_wake_time")
    private LocalTime sleepWakeTime;

    @Column(name = "sleep_quality")
    private Integer sleepQuality; // 1-10

    @Column(name = "water_glasses")
    private int waterGlasses = 0;

    @Column(name = "breakfast_eaten")
    private boolean breakfastEaten = false;
    @Column(name = "breakfast_what")
    private String breakfastWhat;

    @Column(name = "lunch_eaten")
    private boolean lunchEaten = false;
    @Column(name = "lunch_what")
    private String lunchWhat;

    @Column(name = "dinner_eaten")
    private boolean dinnerEaten = false;
    @Column(name = "dinner_what")
    private String dinnerWhat;

    @Column(name = "food_quality")
    private Integer foodQuality; // 1-5

    @Column(name = "energy_morning")
    private Integer energyMorning;
    @Column(name = "energy_afternoon")
    private Integer energyAfternoon;
    @Column(name = "energy_evening")
    private Integer energyEvening;
}

