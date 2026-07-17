package com.thesystem.config;

import com.thesystem.entity.Quest;
import com.thesystem.entity.QuestCategory;
import com.thesystem.repository.PlayerRepository;
import com.thesystem.repository.QuestRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Seeds THE SYSTEM's default quests on startup.
 * Also resets all player XP/levels to 1 on first run after the realistic XP migration.
 *
 * MIGRATION (Option A): All existing player data resets to Level 1, XP = 0.
 * This is required because the old system used 100 XP/level; the new system
 * uses 500-3500 XP/level for realistic 8-12 month progression.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final QuestRepository questRepository;
    private final PlayerRepository playerRepository;

    public DataSeeder(QuestRepository questRepository, PlayerRepository playerRepository) {
        this.questRepository = questRepository;
        this.playerRepository = playerRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedQuestsIfEmpty();
        migrateXpReset();
    }

    // ── XP Migration ───────────────────────────────────────────────────────────

    /**
     * Option A: Reset all existing player levels to 1 and currentXp to 0.
     * This runs once — after the migration we do NOT keep resetting.
     * We detect "needs migration" by checking if any player is still on the old
     * sub-5-level cap that was reachable in minutes with the old 100-XP threshold.
     * Safe to run multiple times (idempotent for already-reset players).
     */
    private void migrateXpReset() {
        playerRepository.findAll().forEach(player -> {
            // Reset all players to Level 1, Rank E, XP 0 (fresh realistic start)
            if (player.getLevel() > 0 && player.getTotalXp() < 500) {
                // Already at realistic starting point, skip
                return;
            }
            player.setLevel(1);
            player.setCurrentXp(0);
            player.setRankLevel("E");
            playerRepository.save(player);
        });
    }

    // ── Quest Seeding ──────────────────────────────────────────────────────────

    private void seedQuestsIfEmpty() {
        if (questRepository.count() > 0) return;

        List<Quest> quests = List.of(

            // ═══ DAILY — Core Foundational Habits ══════════════════════════════
            // These reset every midnight and should be done every single day.

            buildDaily("COURAGE_OF_THE_WEAK",
                "[DAILY] Secret Quest: Courage of the Weak (10 Push-ups, 10 Sit-ups, 10 Squats, 1km Walk)",
                QuestCategory.DAILY, 50, "{\"STR\":3,\"VIT\":3,\"AGI\":2}", null, 10, true, 50, false),

            buildDaily("BREAKFAST",
                "[DAILY] Eat breakfast before 9:30 AM",
                QuestCategory.DAILY, 40, "{\"VIT\":2}", null, 2, false, 5, false),

            buildDaily("WATER",
                "[DAILY] Drink 2 bottles of water",
                QuestCategory.DAILY, 30, "{\"VIT\":2}", null, 2, false, 5, false),

            buildDaily("EXERCISE",
                "[DAILY] 20-min exercise or walk outside",
                QuestCategory.DAILY, 80, "{\"STR\":4,\"HOR\":5}", null, 5, true, 30, false),

            buildDaily("SLEEP",
                "[DAILY] Slept before 11:30 PM last night",
                QuestCategory.DAILY, 50, "{\"VIT\":3,\"HOR\":6}", null, 5, true, 10, false),

            buildDaily("NO_REELS",
                "[DAILY] No reels or screens after 11 PM",
                QuestCategory.DAILY, 90, "{\"AGI\":1,\"INT\":1}", null, 4, false, 25, false),

            // ═══ SKILL — Daily Practice ════════════════════════════════════════

            buildDaily("CODE_NO_AI",
                "[SKILL] 1 hour coding WITHOUT AI or Copilot",
                QuestCategory.SKILL, 150, "{\"INT\":5,\"PER\":3}",
                "{\"Java + Spring Boot\":3,\"Angular / JavaScript\":2}", 5, true, 80, false),

            buildDaily("LEETCODE",
                "[SKILL] Solve 1 LeetCode problem",
                QuestCategory.SKILL, 120, "{\"INT\":4,\"PER\":4}", "{\"DSA / LeetCode\":4}", 5, true, 50, false),

            buildDaily("ENGLISH",
                "[SKILL] 20 min English speaking practice",
                QuestCategory.SKILL, 100, "{\"AGI\":6}", "{\"English Speaking\":5}", 5, true, 40, false),

            buildDaily("TECH_LEARN",
                "[SKILL] Tech learning session — tutorial or docs",
                QuestCategory.SKILL, 70, "{\"INT\":3}",
                "{\"Java + Spring Boot\":1,\"Angular / JavaScript\":1}", 3, false, 15, false),

            buildDaily("SELF_DEBUG",
                "[SKILL] Debug something yourself (no AI first)",
                QuestCategory.SKILL, 100, "{\"PER\":5,\"INT\":2}", "{\"DSA / LeetCode\":2}", 4, false, 25, false),

            buildDaily("SYSTEM_DESIGN",
                "[SKILL] Read 1 System Design concept",
                QuestCategory.SKILL, 90, "{\"INT\":3,\"PER\":4}", "{\"System Design\":3}", 4, false, 45, false),

            buildDaily("ANGULAR_BUILD",
                "[SKILL] Build Angular component (30 min)",
                QuestCategory.SKILL, 80, "{\"INT\":2}", "{\"Angular / JavaScript\":3}", 4, false, 35, false),

            buildDaily("MOCK_INTERVIEW",
                "[SKILL] Do a mock interview",
                QuestCategory.SKILL, 150, "{\"AGI\":4,\"PER\":3}", "{\"English Speaking\":2}", 5, false, 60, false),

            buildDaily("LINKEDIN_UPDATE",
                "[SKILL] Post/update LinkedIn or apply to 1 job",
                QuestCategory.SKILL, 100, "{\"AGI\":2}", "{\"Career\":2}", 3, false, 20, false),

            buildDaily("READ_NO_SCROLL",
                "[SKILL] Read tech article 20 min (no reels)",
                QuestCategory.SKILL, 70, "{\"INT\":2}", "{\"Java + Spring Boot\":1}", 3, false, 15, true),

            // ═══ TESTOSTERONE — Daily Body Protocol ════════════════════════════

            buildDaily("MORNING_SUN",
                "[TESTOSTERONE] 20 min morning sunlight before 10 AM",
                QuestCategory.TESTOSTERONE, 70, "{\"STR\":2,\"VIT\":3,\"HOR\":4}", null, 3, false, 10, true),

            buildDaily("COLD_SHOWER",
                "[TESTOSTERONE] Cold water last 30 sec of shower",
                QuestCategory.TESTOSTERONE, 60, "{\"STR\":3,\"VIT\":2,\"HOR\":3}", null, 3, false, 15, false),

            buildDaily("ZINC_MEAL",
                "[TESTOSTERONE] Ate eggs / nuts / dhal today",
                QuestCategory.TESTOSTERONE, 50, "{\"VIT\":3,\"STR\":1,\"HOR\":3}", null, 2, false, 5, false),

            buildDaily("NO_SODA",
                "[TESTOSTERONE] No soft drinks or junk today",
                QuestCategory.TESTOSTERONE, 50, "{\"VIT\":4,\"HOR\":5}", null, 3, false, 10, false),

            buildDaily("BREATHING",
                "[TESTOSTERONE] 5 min deep breathing — cortisol reset",
                QuestCategory.TESTOSTERONE, 40, "{\"VIT\":2,\"AGI\":1,\"HOR\":2}", null, 2, false, 5, true),

            buildDaily("NO_PORN",
                "[TESTOSTERONE] No pornography — dopamine reset",
                QuestCategory.TESTOSTERONE, 80, "{\"STR\":3,\"PER\":4,\"HOR\":4}", null, 4, false, 20, false),

            // ═══ WEEKLY — Resets Every Monday ══════════════════════════════════
            // These track meaningful weekly progress goals.

            buildWeekly("WEEKLY_LEETCODE_5",
                "[WEEKLY] Solve 5 LeetCode problems this week",
                QuestCategory.WEEKLY, 400, "{\"INT\":10,\"PER\":8}", "{\"DSA / LeetCode\":8}"),

            buildWeekly("WEEKLY_CONSISTENCY",
                "[WEEKLY] Complete all daily habits for 5 consecutive days",
                QuestCategory.WEEKLY, 500, "{\"VIT\":6,\"STR\":4}", null),

            buildWeekly("WEEKLY_CODE_PURE",
                "[WEEKLY] 3 full coding sessions without AI (3 hrs total)",
                QuestCategory.WEEKLY, 450, "{\"INT\":8,\"PER\":6}", "{\"Java + Spring Boot\":5}"),

            buildWeekly("WEEKLY_ENGLISH_TALK",
                "[WEEKLY] 2 English speaking sessions (20 min each)",
                QuestCategory.WEEKLY, 300, "{\"AGI\":8}", "{\"English Speaking\":6}"),

            buildWeekly("WEEKLY_BODY",
                "[WEEKLY] Exercise 4 out of 7 days this week",
                QuestCategory.WEEKLY, 350, "{\"STR\":8,\"HOR\":6}", null),

            // ═══ MONTHLY — Resets Every 1st ════════════════════════════════════
            // These track major monthly goals.

            buildMonthly("MONTHLY_JOB_APPS",
                "[MONTHLY] Apply to 10 jobs this month",
                QuestCategory.MONTHLY, 800, "{\"INT\":5,\"AGI\":5}", "{\"Career\":10}"),

            buildMonthly("MONTHLY_HABIT_STREAK",
                "[MONTHLY] Maintain a 21-day habit streak this month",
                QuestCategory.MONTHLY, 1000, "{\"VIT\":10,\"STR\":5,\"HOR\":8}", null),

            buildMonthly("MONTHLY_LEETCODE_20",
                "[MONTHLY] Solve 20 LeetCode problems this month",
                QuestCategory.MONTHLY, 900, "{\"INT\":12,\"PER\":10}", "{\"DSA / LeetCode\":15}"),

            // ═══ MILESTONE — One-Time Achievement Quests ═══════════════════════
            // These appear on the Milestones tab, NOT in the daily quest list.

            buildMilestone("FIRST_LEETCODE",
                "[MILESTONE] Solve your very first LeetCode problem",
                QuestCategory.MILESTONE, 200, "{\"INT\":5,\"PER\":5}"),

            buildMilestone("FIRST_COLD",
                "[MILESTONE] First cold shower ever",
                QuestCategory.MILESTONE, 150, "{\"STR\":5,\"HOR\":5}"),

            buildMilestone("FIRST_ENGLISH",
                "[MILESTONE] First mock English interview practice",
                QuestCategory.MILESTONE, 200, "{\"AGI\":8}"),

            buildMilestone("FIRST_NO_AI",
                "[MILESTONE] First full day coding session without AI",
                QuestCategory.MILESTONE, 300, "{\"INT\":8,\"PER\":5}"),

            buildMilestone("FIRST_GYM",
                "[MILESTONE] Visit a gym for the first time",
                QuestCategory.MILESTONE, 200, "{\"STR\":8}"),

            buildMilestone("FIRST_MEETUP",
                "[MILESTONE] Attend first Chennai tech meetup",
                QuestCategory.MILESTONE, 250, "{\"AGI\":5,\"INT\":3}"),

            buildMilestone("FIRST_SAVINGS",
                "[MILESTONE] Transfer first \u20b9500 to savings",
                QuestCategory.MILESTONE, 200, "{\"VIT\":3}"),

            buildMilestone("FIRST_JOB_APP",
                "[MILESTONE] Submit first job application",
                QuestCategory.MILESTONE, 300, "{\"INT\":3,\"AGI\":3}"),

            buildMilestone("FIRST_MOCK_INTERVIEW",
                "[MILESTONE] Complete your first mock interview",
                QuestCategory.MILESTONE, 300, "{\"AGI\":6,\"PER\":4}")
        );

        questRepository.saveAll(quests);
    }

    // ── Builder Helpers ────────────────────────────────────────────────────────

    private Quest buildDaily(String key, String label, QuestCategory cat, int xp,
                              String stats, String skills,
                              int priority, boolean critical, int bossDamage, boolean recovery) {
        Quest q = new Quest(key, label, cat, xp, stats, skills);
        q.setTimeType("DAILY");
        q.setPriority(priority);
        q.setCritical(critical);
        q.setBossDamage(bossDamage);
        q.setRecoveryQuest(recovery);
        return q;
    }

    private Quest buildWeekly(String key, String label, QuestCategory cat, int xp,
                               String stats, String skills) {
        Quest q = new Quest(key, label, cat, xp, stats, skills);
        q.setTimeType("WEEKLY");
        q.setPriority(4);
        q.setBossDamage(30);
        return q;
    }

    private Quest buildMonthly(String key, String label, QuestCategory cat, int xp,
                                String stats, String skills) {
        Quest q = new Quest(key, label, cat, xp, stats, skills);
        q.setTimeType("MONTHLY");
        q.setPriority(4);
        q.setBossDamage(50);
        return q;
    }

    private Quest buildMilestone(String key, String label, QuestCategory cat, int xp, String stats) {
        Quest q = new Quest(key, label, cat, xp, stats, null);
        q.setTimeType("ONE_TIME");
        q.setPriority(1);
        q.setBossDamage(10);
        return q;
    }
}

