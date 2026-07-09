package com.thesystem.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "boss_battles")
@Getter
@Setter
public class BossBattle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(nullable = false)
    private String topic;

    @Column(name = "difficulty", length = 20)
    private String difficulty = "MEDIUM"; // EASY, MEDIUM, HARD

    @Column(columnDefinition = "TEXT")
    private String questions; // JSON array of questions

    @Column(columnDefinition = "TEXT")
    private String answers; // JSON array of answers

    @Column(columnDefinition = "TEXT")
    private String evaluations; // JSON array of evaluation results

    private Integer score; // total score 0-50 (5 questions × 10)

    @Column(name = "xp_earned")
    private int xpEarned = 0;

    @Column(name = "started_at")
    private LocalDateTime startedAt = LocalDateTime.now();

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}

