package com.thesystem.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Tracks individual deep work coding sessions.
 *
 * Focus XP formula:
 *   Base:    codingMinutes / 5
 *   Bonus:   focusSessions × 10 (Pomodoro-style)
 *   Penalty: interruptions × 5 + mobilePickups × 3
 *   Min:     0 XP
 *
 * Focus Score (0–100): 100 − (interruptions × 5) − (mobilePickups × 3)
 * This is separate from and additive with quest XP.
 */
@Entity
@Table(name = "deep_work_sessions")
@Getter
@Setter
public class DeepWorkSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate = LocalDate.now();

    /** Total coding minutes in this session. */
    @Column(name = "coding_minutes", nullable = false)
    private int codingMinutes = 0;

    /** Number of interruptions (meetings, calls, distractions) during the session. */
    @Column(name = "interruptions", nullable = false)
    private int interruptions = 0;

    /** Number of times the phone was picked up during the session. */
    @Column(name = "mobile_pickups", nullable = false)
    private int mobilePickups = 0;

    /** Number of completed Pomodoro/focus blocks (typically 25-min sessions). */
    @Column(name = "focus_sessions", nullable = false)
    private int focusSessions = 0;

    /** Computed Focus XP earned from this session (awarded to the player). */
    @Column(name = "focus_xp_earned", nullable = false)
    private int focusXpEarned = 0;

    /** Computed focus quality score (0–100). */
    @Column(name = "focus_score", nullable = false)
    private int focusScore = 100;

    @Column(length = 500)
    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
