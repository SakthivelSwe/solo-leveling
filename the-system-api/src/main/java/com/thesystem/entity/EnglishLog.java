package com.thesystem.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "english_logs", uniqueConstraints = @UniqueConstraint(columnNames = {"player_id", "log_date"}))
@Getter
@Setter
public class EnglishLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate = LocalDate.now();

    @Column(name = "speaking_min")
    private int speakingMin = 0;

    @Column(name = "resource_used")
    private String resourceUsed;

    @Column(name = "new_words")
    private int newWords = 0;

    @Column(name = "mock_interview")
    private boolean mockInterview = false;

    @Column(name = "topic_practiced")
    private String topicPracticed;

    @Column(name = "self_rating")
    private Integer selfRating; // 1-10

    @Column(length = 1000)
    private String notes;
}

