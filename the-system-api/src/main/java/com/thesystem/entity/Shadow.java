package com.thesystem.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * A Shadow is a mastered habit that has transcended into a permanent power.
 * Activated when a habit reaches a 25-day streak.
 *
 * Shadow Level = floor(currentStreak / 7) — levels up every week of consistency.
 * Power Level  = streak × difficulty — the raw strength of this Shadow.
 *
 * Each active Shadow adds +1% XP bonus for quests in its category.
 * This is THE SYSTEM's most powerful long-term motivation mechanic:
 * the player literally builds an army of mastered habits that fight for them.
 */
@Entity
@Table(name = "shadows",
        uniqueConstraints = @UniqueConstraint(columnNames = {"player_id", "habit_id"}))
@Getter
@Setter
public class Shadow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    /** The habit that birthed this Shadow (preserved even if habit is archived). */
    @Column(name = "habit_id", nullable = false)
    private Long habitId;

    @Column(name = "shadow_name", nullable = false, length = 100)
    private String shadowName;

    /**
     * Shadow archetype drives the category of XP bonus applied.
     * FIGHTER (STR/HOR), SCHOLAR (INT/PER), MONK (VIT), WARRIOR (AGI).
     */
    @Column(name = "shadow_type", length = 20)
    private String shadowType;

    /** Current shadow level: floor(streak / 7). Increases weekly. */
    @Column(name = "shadow_level", nullable = false)
    private int shadowLevel = 1;

    /** Raw power = streak × difficulty. Higher = stronger XP bonus. */
    @Column(name = "power_level", nullable = false)
    private int powerLevel = 0;

    /** Streak count at last level computation. Used for display. */
    @Column(name = "streak_at_activation", nullable = false)
    private int streakAtActivation = 25;

    @Column(name = "active_since", nullable = false)
    private LocalDate activeSince = LocalDate.now();

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated = LocalDateTime.now();
}
