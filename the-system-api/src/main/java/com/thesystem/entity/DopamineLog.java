package com.thesystem.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Tracks daily dopamine-draining behaviors that reduce focus and XP multiplier.
 *
 * Dopamine Score (0–100):
 *   Social media > 30 min: +8 per 30-min block
 *   Reels/Shorts > 30 min: +15 per 30-min block (more addictive)
 *   Gaming > 1 hr:         +12
 *   Junk food items:       +5 per item
 *   Porn viewed:           +20
 *   Exercise done:         −20
 *   Cold shower:           −10
 *
 * Focus Multiplier (applied to XP earned):
 *   Score 0–30:  100%
 *   Score 31–60: 85%
 *   Score 61–80: 70%
 *   Score 81+:   55%
 */
@Entity
@Table(name = "dopamine_logs",
        uniqueConstraints = @UniqueConstraint(columnNames = {"player_id", "log_date"}))
@Getter
@Setter
public class DopamineLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate = LocalDate.now();

    /** Total minutes spent on social media (Instagram, Twitter, etc.). */
    @Column(name = "social_media_min", nullable = false)
    private int socialMediaMin = 0;

    /** Minutes spent on short-form video (YouTube Shorts, Instagram Reels, TikTok). */
    @Column(name = "reels_min", nullable = false)
    private int reelsMin = 0;

    /** Minutes spent gaming. */
    @Column(name = "gaming_min", nullable = false)
    private int gamingMin = 0;

    /** Number of junk food items consumed today. */
    @Column(name = "junk_food_items", nullable = false)
    private int junkFoodItems = 0;

    /** Whether pornography was viewed today. */
    @Column(name = "porn_viewed", nullable = false)
    private boolean pornViewed = false;

    /** Whether exercise was completed today (reduces dopamine score). */
    @Column(name = "exercise_done", nullable = false)
    private boolean exerciseDone = false;

    /** Whether a cold shower was taken today (reduces dopamine score). */
    @Column(name = "cold_shower", nullable = false)
    private boolean coldShower = false;

    /** Computed dopamine score (0–100). Stored for history/trend analysis. */
    @Column(name = "dopamine_score", nullable = false)
    private int dopamineScore = 0;

    /** Computed focus multiplier as a percentage (55–100). */
    @Column(name = "focus_pct", nullable = false)
    private int focusPct = 100;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
