package com.thesystem.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "quest_skips",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_player_quest_date_skip",
                columnNames = {"player_id", "quest_id", "skipped_at"}))
public class QuestSkip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(name = "quest_id", nullable = false)
    private Long questId;

    @Column(name = "skipped_at", nullable = false)
    private LocalDate skippedAt;

    @Column(name = "reason", length = 500)
    private String reason;

    public QuestSkip() {}

    public QuestSkip(Long playerId, Long questId, LocalDate skippedAt, String reason) {
        this.playerId = playerId;
        this.questId = questId;
        this.skippedAt = skippedAt;
        this.reason = reason;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPlayerId() { return playerId; }
    public void setPlayerId(Long playerId) { this.playerId = playerId; }
    public Long getQuestId() { return questId; }
    public void setQuestId(Long questId) { this.questId = questId; }
    public LocalDate getSkippedAt() { return skippedAt; }
    public void setSkippedAt(LocalDate skippedAt) { this.skippedAt = skippedAt; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
