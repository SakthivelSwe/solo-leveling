package com.thesystem.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * A long-term identity-shaping habit (Atomic Habits + Power of Habit engine).
 * Distinct from Quests — quests reset daily, habits track streaks + identity progress
 * and use the Cue → Craving → Routine → Reward loop.
 */
@Entity
@Table(name = "habits", indexes = {
        @Index(name = "idx_habit_player", columnList = "player_id"),
        @Index(name = "idx_habit_active", columnList = "player_id, archived")
})
public class Habit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(nullable = false, length = 120)
    private String name;

    /** Identity statement: "I am becoming a [Hunter / Scholar / Warrior / Monk]". */
    @Column(name = "identity_tag", length = 60)
    private String identityTag;

    /** 1st Law — Make it Obvious. When + where + trigger. */
    @Column(length = 300)
    private String cue;

    /** 2nd Law — Make it Attractive. Why it matters + temptation bundle. */
    @Column(length = 300)
    private String craving;

    /** 3rd Law — Make it Easy. The actual action. */
    @Column(length = 300)
    private String routine;

    /** 4th Law — Make it Satisfying. The immediate reward after doing it. */
    @Column(length = 300)
    private String reward;

    /** 2-minute rule scale-down version ("Just put on running shoes"). */
    @Column(name = "two_minute_version", length = 200)
    private String twoMinuteVersion;

    /** Habit stacking — "After [existing habit id], I will do this one". */
    @Column(name = "stack_after_habit_id")
    private Long stackAfterHabitId;

    /** Cue time (24h HH:mm) for scheduling reminders + implementation intention. */
    @Column(name = "cue_time", length = 5)
    private String cueTime;

    @Column(name = "cue_location", length = 100)
    private String cueLocation;

    /** 1-5 difficulty; feeds XP multiplier. */
    @Column(nullable = false)
    private int difficulty = 1;

    /** Keystone habits get 2× XP + unlock the Keystone Bearer title. */
    @Column(name = "is_keystone", nullable = false)
    private boolean keystone = false;

    /** Bitmask of active days: bit0=Mon … bit6=Sun. 127 = every day. */
    @Column(name = "active_days", nullable = false)
    private int activeDays = 127;

    @Column(nullable = false)
    private boolean archived = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Habit() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPlayerId() { return playerId; }
    public void setPlayerId(Long playerId) { this.playerId = playerId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getIdentityTag() { return identityTag; }
    public void setIdentityTag(String identityTag) { this.identityTag = identityTag; }
    public String getCue() { return cue; }
    public void setCue(String cue) { this.cue = cue; }
    public String getCraving() { return craving; }
    public void setCraving(String craving) { this.craving = craving; }
    public String getRoutine() { return routine; }
    public void setRoutine(String routine) { this.routine = routine; }
    public String getReward() { return reward; }
    public void setReward(String reward) { this.reward = reward; }
    public String getTwoMinuteVersion() { return twoMinuteVersion; }
    public void setTwoMinuteVersion(String twoMinuteVersion) { this.twoMinuteVersion = twoMinuteVersion; }
    public Long getStackAfterHabitId() { return stackAfterHabitId; }
    public void setStackAfterHabitId(Long stackAfterHabitId) { this.stackAfterHabitId = stackAfterHabitId; }
    public String getCueTime() { return cueTime; }
    public void setCueTime(String cueTime) { this.cueTime = cueTime; }
    public String getCueLocation() { return cueLocation; }
    public void setCueLocation(String cueLocation) { this.cueLocation = cueLocation; }
    public int getDifficulty() { return difficulty; }
    public void setDifficulty(int difficulty) { this.difficulty = difficulty; }
    public boolean isKeystone() { return keystone; }
    public void setKeystone(boolean keystone) { this.keystone = keystone; }
    public int getActiveDays() { return activeDays; }
    public void setActiveDays(int activeDays) { this.activeDays = activeDays; }
    public boolean isArchived() { return archived; }
    public void setArchived(boolean archived) { this.archived = archived; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

