package com.thesystem.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "job_change_quests")


public class JobChangeQuest {
    public JobChangeQuest() {}


    @Id
    private Long playerId;

    private boolean isActive = false;
    private boolean isCompleted = false;

    private int requiredQuests = 30;
    private int completedQuests = 0;

    private LocalDateTime startedAt;
    private LocalDateTime deadline;
    public Long getPlayerId() { return playerId; }
    public void setPlayerId(Long playerId) { this.playerId = playerId; }
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
    public boolean isCompleted() { return isCompleted; }
    public void setCompleted(boolean completed) { isCompleted = completed; }
    public int getRequiredQuests() { return requiredQuests; }
    public void setRequiredQuests(int requiredQuests) { this.requiredQuests = requiredQuests; }
    public int getCompletedQuests() { return completedQuests; }
    public void setCompletedQuests(int completedQuests) { this.completedQuests = completedQuests; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
    public LocalDateTime getDeadline() { return deadline; }
    public void setDeadline(LocalDateTime deadline) { this.deadline = deadline; }

}