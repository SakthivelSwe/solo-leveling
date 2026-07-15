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

    /**
     * Priority tier for the Daily Mission Generator (1=lowest … 5=critical).
     * Critical quests (CODE_NO_AI, LEETCODE, ENGLISH, EXERCISE, SLEEP) = 5.
     */
    @Column(nullable = false)
    private int priority = 3;

    /**
     * Critical quests are always included in the 5-quest daily mission set regardless
     * of stat weighting — they directly drive the job-switch goal.
     */
    @Column(name = "is_critical", columnDefinition = "boolean default false")
    private boolean critical = false;

    /**
     * Damage this quest deals to the weekly dungeon boss.
     * Replaces the old flat 10-damage-per-quest constant.
     * High-effort quests (CODE_NO_AI=80, LEETCODE=50) deal more damage,
     * making boss fights require meaningful work to clear.
     */
    @Column(name = "boss_damage", columnDefinition = "integer default 10")
    private int bossDamage = 10;

    /**
     * Recovery quests count double toward the minimum daily threshold on rest days
     * (Meditation, Walking, Stretching, Journaling, Sunlight).
     */
    @Column(name = "is_recovery_quest", columnDefinition = "boolean default false")
    private boolean recoveryQuest = false;

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
    public int getPriority() { return priority; }
    public void setPriority(int priority) { this.priority = priority; }
    public boolean isCritical() { return critical; }
    public void setCritical(boolean critical) { this.critical = critical; }
    public int getBossDamage() { return bossDamage; }
    public void setBossDamage(int bossDamage) { this.bossDamage = bossDamage; }
    public boolean isRecoveryQuest() { return recoveryQuest; }
    public void setRecoveryQuest(boolean recoveryQuest) { this.recoveryQuest = recoveryQuest; }
}

