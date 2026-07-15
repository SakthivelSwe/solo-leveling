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
    private int skillPct = 0; // 0-100, represents overall mastery %

    /**
     * Accumulated skill-specific XP. Each quest skill boost awards (boostValue × 10) XP.
     * Drives skillLevel and skillRank independently from skillPct.
     */
    @Column(name = "skill_xp", nullable = false)
    private int skillXp = 0;

    /**
     * RPG level for this skill. Formula: floor(skillXp / 100).
     * Displayed as "Java — Lv 28" instead of a flat percentage.
     */
    @Column(name = "skill_level", nullable = false)
    private int skillLevel = 1;

    /**
     * Letter rank derived from skillLevel:
     * Lv 1–9 = E, Lv 10–19 = D, Lv 20–29 = C, Lv 30–39 = B, Lv 40+ = A.
     */
    @Column(name = "skill_rank", length = 2, nullable = false)
    private String skillRank = "E";

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
    public int getSkillXp() { return skillXp; }
    public void setSkillXp(int skillXp) { this.skillXp = skillXp; }
    public int getSkillLevel() { return skillLevel; }
    public void setSkillLevel(int skillLevel) { this.skillLevel = skillLevel; }
    public String getSkillRank() { return skillRank; }
    public void setSkillRank(String skillRank) { this.skillRank = skillRank; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    /** Recomputes skillLevel and skillRank from current skillXp. Call after each XP change. */
    public void recalculateLevelAndRank() {
        this.skillLevel = Math.max(1, this.skillXp / 100);
        this.skillRank = this.skillLevel >= 40 ? "A"
                : this.skillLevel >= 30 ? "B"
                : this.skillLevel >= 20 ? "C"
                : this.skillLevel >= 10 ? "D" : "E";
    }
}

