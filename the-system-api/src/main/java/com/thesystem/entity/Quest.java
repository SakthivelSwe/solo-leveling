package com.thesystem.entity;

import jakarta.persistence.*;
import java.util.Map;
import java.util.HashMap;

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

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "quest_stat_boosts", joinColumns = @JoinColumn(name = "quest_id"))
    @MapKeyColumn(name = "stat_name", length = 50)
    @Column(name = "boost_value")
    private Map<String, Integer> statBoosts = new HashMap<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "quest_skill_boosts", joinColumns = @JoinColumn(name = "quest_id"))
    @MapKeyColumn(name = "skill_name", length = 100)
    @Column(name = "boost_value")
    private Map<String, Integer> skillBoosts = new HashMap<>();

    @Column(name = "is_active")
    private boolean active = true;

    /**
     * Priority tier for the Daily Mission Generator (1=lowest ... 5=critical).
     * Critical quests (CODE_NO_AI, LEETCODE, ENGLISH, EXERCISE, SLEEP) = 5.
     */
    @Column(columnDefinition = "integer default 3")
    private int priority = 3;

    /**
     * Critical quests are always included in the 5-quest daily mission set regardless
     * of stat weighting — they directly drive the job-switch goal.
     */
    @Column(name = "is_critical", columnDefinition = "boolean default false")
    private boolean critical = false;

    /**
     * Damage this quest deals to the weekly dungeon boss.
     */
    @Column(name = "boss_damage", columnDefinition = "integer default 10")
    private int bossDamage = 10;

    /**
     * Recovery quests count double toward the minimum daily threshold on rest days.
     */
    @Column(name = "is_recovery_quest", columnDefinition = "boolean default false")
    private boolean recoveryQuest = false;

    /**
     * Reset frequency: DAILY (midnight), WEEKLY (Monday), MONTHLY (1st), ONE_TIME (never resets).
     * Determines how often the player can complete and earn XP from this quest.
     */
    @Column(name = "time_type", length = 20, columnDefinition = "varchar(20) default 'DAILY'")
    private String timeType = "DAILY";

    /**
     * True for quests created by a specific player (not seeded system quests).
     * Custom quests are owned by one player and can be deleted by them.
     */
    @Column(name = "is_custom", columnDefinition = "boolean default false")
    private boolean custom = false;

    /**
     * Owner player ID for custom quests. Null for global system quests.
     * Custom quests with a playerId are only visible to that player.
     */
    @Column(name = "player_id")
    private Long ownerId;

    /**
     * Minimum player level required to unlock this quest.
     * Prevents level 1 players from getting overwhelmed by level 10 quests.
     */
    @Column(name = "min_level", columnDefinition = "integer default 1")
    private int minLevel = 1;

    public Quest() {}

    public Quest(String questKey, String label, QuestCategory category, int xpReward,
                 Map<String, Integer> statBoosts, Map<String, Integer> skillBoosts) {
        this.questKey = questKey;
        this.label = label;
        this.category = category;
        this.xpReward = xpReward;
        this.statBoosts = statBoosts;
        this.skillBoosts = skillBoosts;
    }

    // ── Getters & Setters ──────────────────────────────────────────────────────

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
    public Map<String, Integer> getStatBoosts() { return statBoosts; }
    public void setStatBoosts(Map<String, Integer> statBoosts) { this.statBoosts = statBoosts; }
    public Map<String, Integer> getSkillBoosts() { return skillBoosts; }
    public void setSkillBoosts(Map<String, Integer> skillBoosts) { this.skillBoosts = skillBoosts; }
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
    public String getTimeType() { return timeType; }
    public void setTimeType(String timeType) { this.timeType = timeType; }
    public boolean isCustom() { return custom; }
    public void setCustom(boolean custom) { this.custom = custom; }
    public Long getOwnerId() { return ownerId; }
    public void setOwnerId(Long ownerId) { this.ownerId = ownerId; }
    public int getMinLevel() { return minLevel; }
    public void setMinLevel(int minLevel) { this.minLevel = minLevel; }

    /** True if this is a one-time milestone quest (never resets after completion). */
    public boolean isOneTime() {
        return "ONE_TIME".equals(timeType)
                || category == QuestCategory.SIDE
                || category == QuestCategory.MILESTONE;
    }
}

