package com.thesystem.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

/**
 * A single completion of a Habit for a given date. Unique per (player, habit, date)
 * so double-tap can never award XP twice.
 */
@Entity
@Table(name = "habit_completions",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_habit_player_date",
                columnNames = {"player_id", "habit_id", "completed_at"}),
        indexes = {
                @Index(name = "idx_hc_player_date", columnList = "player_id, completed_at"),
                @Index(name = "idx_hc_habit_date", columnList = "habit_id, completed_at")
        })
public class HabitCompletion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(name = "habit_id", nullable = false)
    private Long habitId;

    @Column(name = "completed_at", nullable = false)
    private LocalDate completedAt;

    /** 1-5 quality rating; feeds compounding "1% better" curve. */
    @Column(nullable = false)
    private int quality = 3;

    @Column(name = "xp_gained", nullable = false)
    private int xpGained;

    /** True if user tapped "two-minute rule" (still counts for streak, half XP). */
    @Column(name = "two_minute", nullable = false)
    private boolean twoMinute = false;

    @Column(length = 500)
    private String note;

    public HabitCompletion() {}

    public HabitCompletion(Long playerId, Long habitId, LocalDate completedAt,
                           int quality, int xpGained, boolean twoMinute, String note) {
        this.playerId = playerId;
        this.habitId = habitId;
        this.completedAt = completedAt;
        this.quality = quality;
        this.xpGained = xpGained;
        this.twoMinute = twoMinute;
        this.note = note;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPlayerId() { return playerId; }
    public void setPlayerId(Long playerId) { this.playerId = playerId; }
    public Long getHabitId() { return habitId; }
    public void setHabitId(Long habitId) { this.habitId = habitId; }
    public LocalDate getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDate completedAt) { this.completedAt = completedAt; }
    public int getQuality() { return quality; }
    public void setQuality(int quality) { this.quality = quality; }
    public int getXpGained() { return xpGained; }
    public void setXpGained(int xpGained) { this.xpGained = xpGained; }
    public boolean isTwoMinute() { return twoMinute; }
    public void setTwoMinute(boolean twoMinute) { this.twoMinute = twoMinute; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}

