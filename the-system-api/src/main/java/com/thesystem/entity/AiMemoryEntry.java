package com.thesystem.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * A memory entry for the AI Mentor. Generated weekly (every Sunday) by AiMemoryService.
 * Injected into the AI prompt to give THE SYSTEM personal, specific coaching context
 * instead of generic advice.
 *
 * Examples:
 *   "Last week you skipped LEETCODE 3 times."
 *   "English practice improved by 32% vs 2 weeks ago."
 *   "Sleep has been declining — bedtime moved 40min later over 4 days."
 *
 * Only the last 4 weeks are kept (rolling window) to avoid context bloat.
 */
@Entity
@Table(name = "ai_memory")
@Getter
@Setter
public class AiMemoryEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    /** SKIP, STREAK, IMPROVEMENT, DECLINE, BEHAVIORAL */
    @Column(name = "memory_type", nullable = false, length = 20)
    private String memoryType;

    /** The quest key or skill name this memory is about (nullable for general memories). */
    @Column(name = "quest_key", length = 50)
    private String questKey;

    /**
     * Human-readable memory text injected into the AI prompt.
     * Example: "Skipped LEETCODE 3 times this week."
     */
    @Column(nullable = false, length = 500)
    private String value;

    /** The week this memory was generated for (Monday = start). */
    @Column(name = "week_start", nullable = false)
    private LocalDate weekStart;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
