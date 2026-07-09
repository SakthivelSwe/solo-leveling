package com.thesystem.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "player_skills")
public class PlayerSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(name = "skill_name", nullable = false, length = 100)
    private String skillName;

    @Column(name = "skill_pct")
    private int skillPct = 0; // 0-100, level = floor(pct/10)

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public PlayerSkill() {}

    public PlayerSkill(Long playerId, String skillName, int skillPct) {
        this.playerId = playerId;
        this.skillName = skillName;
        this.skillPct = skillPct;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPlayerId() { return playerId; }
    public void setPlayerId(Long playerId) { this.playerId = playerId; }
    public String getSkillName() { return skillName; }
    public void setSkillName(String skillName) { this.skillName = skillName; }
    public int getSkillPct() { return skillPct; }
    public void setSkillPct(int skillPct) { this.skillPct = skillPct; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

