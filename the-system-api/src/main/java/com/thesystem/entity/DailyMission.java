package com.thesystem.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Stores the AI-generated daily mission set for a player.
 * The generator picks 5 critical + main quests and 3 side quests each day
 * based on the player's weakest stats, reducing decision fatigue.
 */
@Entity
@Table(name = "daily_missions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"player_id", "mission_date"}))
public class DailyMission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(name = "mission_date", nullable = false)
    private LocalDate missionDate;

    /** JSON array of quest keys for the 5 main quests (always includes critical quests). */
    @Column(name = "main_quest_keys", length = 500)
    private String mainQuestKeys;

    /** JSON array of quest keys for the 3 supporting side quests. */
    @Column(name = "side_quest_keys", length = 300)
    private String sideQuestKeys;

    /** The weakest stat that drove today's quest selection (e.g., "INT", "AGI"). */
    @Column(name = "focus_stat", length = 10)
    private String focusStat;

    /** Human-readable focus area (e.g., "CAREER", "HEALTH", "ENGLISH"). */
    @Column(name = "focus_area", length = 30)
    private String focusArea;

    @Column(name = "generated_at")
    private LocalDateTime generatedAt = LocalDateTime.now();

    public DailyMission() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPlayerId() { return playerId; }
    public void setPlayerId(Long playerId) { this.playerId = playerId; }
    public LocalDate getMissionDate() { return missionDate; }
    public void setMissionDate(LocalDate missionDate) { this.missionDate = missionDate; }
    public String getMainQuestKeys() { return mainQuestKeys; }
    public void setMainQuestKeys(String mainQuestKeys) { this.mainQuestKeys = mainQuestKeys; }
    public String getSideQuestKeys() { return sideQuestKeys; }
    public void setSideQuestKeys(String sideQuestKeys) { this.sideQuestKeys = sideQuestKeys; }
    public String getFocusStat() { return focusStat; }
    public void setFocusStat(String focusStat) { this.focusStat = focusStat; }
    public String getFocusArea() { return focusArea; }
    public void setFocusArea(String focusArea) { this.focusArea = focusArea; }
    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }
}
