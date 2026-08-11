package com.thesystem.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Stores the initial onboarding assessment answers and derived domain scores.
 * Created once per player when they complete the adaptive questionnaire after registration.
 * The domain scores (0-100) are mapped to PlayerStats to set accurate starting values.
 */
@Entity
@Table(name = "onboarding_assessments", indexes = {
        @Index(name = "idx_assessment_player", columnList = "player_id")
})
public class OnboardingAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    /** Raw JSON of the adaptive questionnaire answers (for future reference/re-scoring). */
    @Column(name = "answers_json", columnDefinition = "TEXT")
    private String answersJson;

    // Domain scores (0-100) derived from questionnaire answers
    /** Physical fitness/body score */
    @Column(name = "body_score", nullable = false)
    private int bodyScore = 10;

    /** Mental clarity/mind score */
    @Column(name = "mind_score", nullable = false)
    private int mindScore = 10;

    /** Career/learning score */
    @Column(name = "career_score", nullable = false)
    private int careerScore = 10;

    /** Discipline/consistency score */
    @Column(name = "discipline_score", nullable = false)
    private int disciplineScore = 10;

    /** English/communication score */
    @Column(name = "english_score", nullable = false)
    private int englishScore = 10;

    /** Estimated daily available time in minutes */
    @Column(name = "available_time_minutes", nullable = false)
    private int availableTimeMinutes = 30;

    /** User's stated primary goal */
    @Column(name = "primary_goal", length = 100)
    private String primaryGoal;

    /** Primary identified barrier to progress */
    @Column(name = "primary_barrier", length = 200)
    private String primaryBarrier;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPlayerId() { return playerId; }
    public void setPlayerId(Long playerId) { this.playerId = playerId; }
    public String getAnswersJson() { return answersJson; }
    public void setAnswersJson(String answersJson) { this.answersJson = answersJson; }
    public int getBodyScore() { return bodyScore; }
    public void setBodyScore(int bodyScore) { this.bodyScore = bodyScore; }
    public int getMindScore() { return mindScore; }
    public void setMindScore(int mindScore) { this.mindScore = mindScore; }
    public int getCareerScore() { return careerScore; }
    public void setCareerScore(int careerScore) { this.careerScore = careerScore; }
    public int getDisciplineScore() { return disciplineScore; }
    public void setDisciplineScore(int disciplineScore) { this.disciplineScore = disciplineScore; }
    public int getEnglishScore() { return englishScore; }
    public void setEnglishScore(int englishScore) { this.englishScore = englishScore; }
    public int getAvailableTimeMinutes() { return availableTimeMinutes; }
    public void setAvailableTimeMinutes(int availableTimeMinutes) { this.availableTimeMinutes = availableTimeMinutes; }
    public String getPrimaryGoal() { return primaryGoal; }
    public void setPrimaryGoal(String primaryGoal) { this.primaryGoal = primaryGoal; }
    public String getPrimaryBarrier() { return primaryBarrier; }
    public void setPrimaryBarrier(String primaryBarrier) { this.primaryBarrier = primaryBarrier; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
