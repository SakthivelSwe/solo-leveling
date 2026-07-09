package com.thesystem.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * A weekly "Gate" raid. The boss has HP that drops as the Hunter clears quests during
 * the week. Clearing the gate (boss HP → 0) grants a one-time bonus XP reward.
 */
@Entity
@Table(name = "dungeons",
        uniqueConstraints = @UniqueConstraint(columnNames = {"player_id", "week_start"}))
public class Dungeon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(name = "week_start", nullable = false)
    private LocalDate weekStart;

    @Column(length = 80)
    private String name;

    @Column(name = "boss_name", length = 60)
    private String bossName;

    @Column(name = "total_hp")
    private int totalHp;

    @Column(name = "damage_dealt")
    private int damageDealt;

    private boolean cleared;

    @Column(name = "cleared_at")
    private LocalDateTime clearedAt;

    @Column(name = "reward_xp")
    private int rewardXp;

    public Dungeon() {}

    public Dungeon(Long playerId, LocalDate weekStart, String name, String bossName,
                   int totalHp, int rewardXp) {
        this.playerId = playerId;
        this.weekStart = weekStart;
        this.name = name;
        this.bossName = bossName;
        this.totalHp = totalHp;
        this.rewardXp = rewardXp;
        this.damageDealt = 0;
        this.cleared = false;
    }

    public Long getId() { return id; }
    public Long getPlayerId() { return playerId; }
    public LocalDate getWeekStart() { return weekStart; }
    public String getName() { return name; }
    public String getBossName() { return bossName; }
    public int getTotalHp() { return totalHp; }
    public void setTotalHp(int totalHp) { this.totalHp = totalHp; }
    public int getDamageDealt() { return damageDealt; }
    public void setDamageDealt(int damageDealt) { this.damageDealt = damageDealt; }
    public boolean isCleared() { return cleared; }
    public void setCleared(boolean cleared) { this.cleared = cleared; }
    public LocalDateTime getClearedAt() { return clearedAt; }
    public void setClearedAt(LocalDateTime clearedAt) { this.clearedAt = clearedAt; }
    public int getRewardXp() { return rewardXp; }
    public void setRewardXp(int rewardXp) { this.rewardXp = rewardXp; }
}

