package com.thesystem.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "flashcards")
public class Flashcard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long playerId;

    @Column(columnDefinition = "TEXT")
    private String frontText;

    @Column(columnDefinition = "TEXT")
    private String backText;

    private String topic;

    // Spaced Repetition fields
    private int intervalDays = 0; // 0 = new
    private int easeFactor = 250; // percentage (250 = 2.5x multiplier)
    
    private LocalDateTime nextReviewDate;

    public Flashcard() {
        this.nextReviewDate = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPlayerId() { return playerId; }
    public void setPlayerId(Long playerId) { this.playerId = playerId; }

    public String getFrontText() { return frontText; }
    public void setFrontText(String frontText) { this.frontText = frontText; }

    public String getBackText() { return backText; }
    public void setBackText(String backText) { this.backText = backText; }

    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }

    public int getIntervalDays() { return intervalDays; }
    public void setIntervalDays(int intervalDays) { this.intervalDays = intervalDays; }

    public int getEaseFactor() { return easeFactor; }
    public void setEaseFactor(int easeFactor) { this.easeFactor = easeFactor; }

    public LocalDateTime getNextReviewDate() { return nextReviewDate; }
    public void setNextReviewDate(LocalDateTime nextReviewDate) { this.nextReviewDate = nextReviewDate; }
}
