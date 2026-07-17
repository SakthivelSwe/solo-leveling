package com.thesystem.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "player_stats")
public class PlayerStats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    private int strength = 10;      // STR - Fitness
    private int intelligence = 10;  // INT - Tech knowledge
    private int vitality = 10;      // VIT - Health / food / sleep
    private int agility = 10;       // AGI - English speaking speed
    private int perception = 10;    // PER - Problem-solving

    @Column(name = "hor")
    private int hor = 10;            // HOR - Hormonal / Testosterone

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPlayerId() { return playerId; }
    public void setPlayerId(Long playerId) { this.playerId = playerId; }
    public int getStrength() { return strength; }
    public void setStrength(int strength) { this.strength = strength; }
    public int getIntelligence() { return intelligence; }
    public void setIntelligence(int intelligence) { this.intelligence = intelligence; }
    public int getVitality() { return vitality; }
    public void setVitality(int vitality) { this.vitality = vitality; }
    public int getAgility() { return agility; }
    public void setAgility(int agility) { this.agility = agility; }
    public int getPerception() { return perception; }
    public void setPerception(int perception) { this.perception = perception; }
    public int getHor() { return hor; }
    public void setHor(int hor) { this.hor = hor; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

