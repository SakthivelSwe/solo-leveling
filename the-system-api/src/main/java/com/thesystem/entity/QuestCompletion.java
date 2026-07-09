package com.thesystem.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "quest_completions",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_player_quest_date",
                columnNames = {"player_id", "quest_id", "completed_at"}))
public class QuestCompletion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(name = "quest_id", nullable = false)
    private Long questId;

    @Column(name = "completed_at", nullable = false)
    private LocalDate completedAt;

    @Column(name = "xp_gained", nullable = false)
    private int xpGained;

    public QuestCompletion() {}

    public QuestCompletion(Long playerId, Long questId, LocalDate completedAt, int xpGained) {
        this.playerId = playerId;
        this.questId = questId;
        this.completedAt = completedAt;
        this.xpGained = xpGained;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPlayerId() { return playerId; }
    public void setPlayerId(Long playerId) { this.playerId = playerId; }
    public Long getQuestId() { return questId; }
    public void setQuestId(Long questId) { this.questId = questId; }
    public LocalDate getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDate completedAt) { this.completedAt = completedAt; }
    public int getXpGained() { return xpGained; }
    public void setXpGained(int xpGained) { this.xpGained = xpGained; }
}

