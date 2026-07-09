package com.thesystem.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "quests")
public class Quest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "quest_key", unique = true, nullable = false, length = 50)
    private String questKey;

    @Column(nullable = false)
    private String label;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private QuestCategory category;

    @Column(name = "xp_reward", nullable = false)
    private int xpReward;

    // Stored as JSON strings (H2 friendly), parsed at runtime
    @Column(name = "stat_boosts", length = 500)
    private String statBoosts;

    @Column(name = "skill_boosts", length = 500)
    private String skillBoosts;

    @Column(name = "is_active")
    private boolean active = true;

    public Quest() {}

    public Quest(String questKey, String label, QuestCategory category, int xpReward,
                 String statBoosts, String skillBoosts) {
        this.questKey = questKey;
        this.label = label;
        this.category = category;
        this.xpReward = xpReward;
        this.statBoosts = statBoosts;
        this.skillBoosts = skillBoosts;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getQuestKey() { return questKey; }
    public void setQuestKey(String questKey) { this.questKey = questKey; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public QuestCategory getCategory() { return category; }
    public void setCategory(QuestCategory category) { this.category = category; }
    public int getXpReward() { return xpReward; }
    public void setXpReward(int xpReward) { this.xpReward = xpReward; }
    public String getStatBoosts() { return statBoosts; }
    public void setStatBoosts(String statBoosts) { this.statBoosts = statBoosts; }
    public String getSkillBoosts() { return skillBoosts; }
    public void setSkillBoosts(String skillBoosts) { this.skillBoosts = skillBoosts; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}

