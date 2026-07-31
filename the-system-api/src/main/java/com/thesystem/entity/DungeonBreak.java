package com.thesystem.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "dungeon_breaks")
public class DungeonBreak {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(nullable = false)
    private String title;

    @Column(length = 500)
    private String description;

    @Column(name = "target_metric")
    private String targetMetric; // e.g., "WATER_LITERS", "LEETCODE_EASY", "PUSHUPS"

    @Column(name = "target_value")
    private int targetValue;

    @Column(name = "time_limit_hours")
    private int timeLimitHours;

    @Column(name = "spawned_at")
    private LocalDateTime spawnedAt = LocalDateTime.now();

    @Column(name = "is_cleared")
    private boolean isCleared = false;
    
    @Column(name = "is_failed")
    private boolean isFailed = false;

    public DungeonBreak() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPlayerId() { return playerId; }
    public void setPlayerId(Long playerId) { this.playerId = playerId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getTargetMetric() { return targetMetric; }
    public void setTargetMetric(String targetMetric) { this.targetMetric = targetMetric; }
    public int getTargetValue() { return targetValue; }
    public void setTargetValue(int targetValue) { this.targetValue = targetValue; }
    public int getTimeLimitHours() { return timeLimitHours; }
    public void setTimeLimitHours(int timeLimitHours) { this.timeLimitHours = timeLimitHours; }
    public LocalDateTime getSpawnedAt() { return spawnedAt; }
    public void setSpawnedAt(LocalDateTime spawnedAt) { this.spawnedAt = spawnedAt; }
    public boolean isCleared() { return isCleared; }
    public void setCleared(boolean cleared) { isCleared = cleared; }
    public boolean isFailed() { return isFailed; }
    public void setFailed(boolean failed) { isFailed = failed; }
}
