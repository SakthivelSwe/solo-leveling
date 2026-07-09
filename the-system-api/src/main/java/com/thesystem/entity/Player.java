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
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

