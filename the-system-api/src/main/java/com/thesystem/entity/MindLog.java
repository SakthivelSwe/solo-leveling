package com.thesystem.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "mind_logs", uniqueConstraints = @UniqueConstraint(columnNames = {"player_id", "log_date"}))
@Getter
@Setter
public class MindLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate = LocalDate.now();

    @Column(name = "mood_morning")
    private Integer moodMorning; // 1-10
    @Column(name = "mood_evening")
    private Integer moodEvening;
    @Column(name = "anxiety_level")
    private Integer anxietyLevel; // 1-10

    @Column(name = "morning_intention", length = 2000)
    private String morningIntention;
    @Column(name = "evening_reflection", length = 2000)
    private String eveningReflection;
    @Column(name = "today_win", length = 500)
    private String todayWin;
    @Column(length = 500)
    private String gratitude;
    @Column(name = "dark_thought", length = 2000)
    private String darkThought;
    @Column(name = "counter_evidence", length = 500)
    private String counterEvidence;

    /**
     * Work/office pressure level (1–10). Combined with anxietyLevel and sleepDebtDays
     * to compute the Stress Meter score (0–100). Triggers Recovery Mode if score > 85.
     */
    @Column(name = "office_pressure")
    private Integer officePressure; // 1-10

    /**
     * Accumulated sleep debt in days (0–7). Each night of less than 7h sleep
     * adds to this counter; a full night of 8h+ reduces it by 1.
     */
    @Column(name = "sleep_debt_days")
    private Integer sleepDebtDays; // 0-7
}

