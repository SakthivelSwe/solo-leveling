package com.thesystem.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "players")
public class Player {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String username;

    @Column(unique = true, nullable = false, length = 100)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "display_name", length = 100)
    private String displayName;

    @Column(name = "rank_level", length = 10)
    private String rankLevel = "E";

    private int level = 1;

    @Column(name = "current_xp")
    private int currentXp = 0;

    @Column(name = "total_xp")
    private int totalXp = 0;

    @Column(name = "hp")
    private int hp = 100;

    @Column(name = "max_hp")
    private int maxHp = 100;

    @Column(name = "equipped_title", length = 40)
    private String equippedTitle;

    /**
     * When true, the end-of-day HP penalty threshold drops from 4 quests to 2.
     * Activated on days the player has work/PG schedule constraints (e.g. Saturdays).
     */
    @jakarta.persistence.Transient
    private boolean restDayActive = false;

    /**
     * Day-of-week (1=Mon … 7=Sun, ISO-8601) treated as rest day.
     * Default 6 = Saturday, matching the player's regular work schedule.
     */
    @jakarta.persistence.Transient
    private int restDayDayOfWeek = 6;

    /**
     * Cached morning energy score (0–100) updated when today's health log is saved.
     * Drives the XP multiplier in QuestService: low energy reduces XP earned.
     */
    @jakarta.persistence.Transient
    private int currentEnergy = 70;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // Getters & setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public String getRankLevel() { return rankLevel; }
    public void setRankLevel(String rankLevel) { this.rankLevel = rankLevel; }
    public int getLevel() { return level; }
    public void setLevel(int level) { this.level = level; }
    public int getCurrentXp() { return currentXp; }
    public void setCurrentXp(int currentXp) { this.currentXp = currentXp; }
    public int getTotalXp() { return totalXp; }
    public void setTotalXp(int totalXp) { this.totalXp = totalXp; }
    public int getHp() { return hp; }
    public void setHp(int hp) { this.hp = hp; }
    public int getMaxHp() { return maxHp; }
    public void setMaxHp(int maxHp) { this.maxHp = maxHp; }
    public String getEquippedTitle() { return equippedTitle; }
    public void setEquippedTitle(String equippedTitle) { this.equippedTitle = equippedTitle; }
    public boolean isRestDayActive() { return restDayActive; }
    public void setRestDayActive(boolean restDayActive) { this.restDayActive = restDayActive; }
    public int getRestDayDayOfWeek() { return restDayDayOfWeek; }
    public void setRestDayDayOfWeek(int restDayDayOfWeek) { this.restDayDayOfWeek = restDayDayOfWeek; }
    public int getCurrentEnergy() { return currentEnergy; }
    public void setCurrentEnergy(int currentEnergy) { this.currentEnergy = currentEnergy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

