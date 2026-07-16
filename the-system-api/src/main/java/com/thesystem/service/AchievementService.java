package com.thesystem.service;

import com.thesystem.dto.AchievementDTO;
import com.thesystem.entity.Achievement;
import com.thesystem.entity.Player;
import com.thesystem.entity.Quest;
import com.thesystem.entity.QuestCompletion;
import com.thesystem.repository.AchievementRepository;
import com.thesystem.repository.HabitRepository;
import com.thesystem.repository.LeetcodeLogRepository;
import com.thesystem.repository.QuestCompletionRepository;
import com.thesystem.repository.QuestRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AchievementService {

    private final AchievementRepository achievementRepository;
    private final QuestCompletionRepository completionRepository;
    private final QuestRepository questRepository;
    private final LeetcodeLogRepository leetcodeRepository;
    private final HabitRepository habitRepository;

    public AchievementService(AchievementRepository achievementRepository,
                              QuestCompletionRepository completionRepository,
                              QuestRepository questRepository,
                              LeetcodeLogRepository leetcodeRepository,
                              HabitRepository habitRepository) {
        this.achievementRepository = achievementRepository;
        this.completionRepository = completionRepository;
        this.questRepository = questRepository;
        this.leetcodeRepository = leetcodeRepository;
        this.habitRepository = habitRepository;
    }

    public List<AchievementDTO> getPlayerAchievements(Long playerId) {
        return achievementRepository.findByPlayerIdOrderByUnlockedAtDesc(playerId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    /**
     * Evaluates all achievement rules and unlocks any newly earned ones.
     * Returns only the achievements unlocked during this call.
     */
    public List<AchievementDTO> evaluate(Player player) {
        List<AchievementDTO> unlocked = new ArrayList<>();
        Long pid = player.getId();
        LocalDate today = LocalDate.now();

        // FIRST_QUEST
        if (completionRepository.countByPlayerId(pid) >= 1) {
            tryUnlock(pid, "FIRST_QUEST", "First Awakening",
                    "Complete your first quest ever", unlocked);
        }

        // LEETCODE_10
        if (countQuest(pid, "LEETCODE") >= 10) {
            tryUnlock(pid, "LEETCODE_10", "Algorithm Hunter",
                    "Solve 10 LeetCode problems total", unlocked);
        }

        // NO_AI_WARRIOR — code without AI 5 days in a row
        if (consecutiveDays(pid, "CODE_NO_AI", today) >= 5) {
            tryUnlock(pid, "NO_AI_WARRIOR", "No-AI Warrior",
                    "Code without AI for 5 days in a row", unlocked);
        }

        // RANK_UP_D / RANK_UP_C
        String rank = player.getRankLevel();
        if (rankAtLeast(rank, "D")) {
            tryUnlock(pid, "RANK_UP_D", "D-Rank Hunter",
                    "Reach D-Rank", unlocked);
        }
        if (rankAtLeast(rank, "C")) {
            tryUnlock(pid, "RANK_UP_C", "C-Rank — Interview Ready",
                    "Reach C-Rank", unlocked);
        }

        // TESTOSTERONE achievements
        if (allTestosteroneToday(pid, today)) {
            tryUnlock(pid, "HORMONE_WARRIOR", "Hormone Warrior",
                    "Complete all 6 testosterone quests in one day", unlocked);
        }
        if (consecutiveDays(pid, "MORNING_SUN", today) >= 10) {
            tryUnlock(pid, "DAWN_HUNTER", "Dawn Hunter",
                    "Get morning sunlight 10 days in a row", unlocked);
        }
        if (consecutiveDays(pid, "NO_PORN", today) >= 14) {
            tryUnlock(pid, "DOPAMINE_RESET", "Dopamine Reset",
                    "Complete NO_PORN quest 14 days — dopamine restored", unlocked);
        }
        if (consecutiveDays(pid, "COLD_SHOWER", today) >= 7) {
            tryUnlock(pid, "COLD_STREAK", "Cold Streak",
                    "Cold shower 7 days in a row", unlocked);
        }
        if (consecutiveDays(pid, "NO_SODA", today) >= 7) {
            tryUnlock(pid, "CLEAN_FUEL", "Clean Fuel",
                    "No junk or soda for 7 days straight", unlocked);
        }

        // ══════════════════════════════════════════════════════════════════
        // Phase 3 — Expanded achievements (50+). All idempotent via tryUnlock.
        // ══════════════════════════════════════════════════════════════════

        int level = player.getLevel();
        int totalXp = player.getTotalXp();
        long totalQuests = completionRepository.countByPlayerId(pid);
        int activeDays = distinctActiveDays(pid);
        long leetTotal = leetcodeRepository.countByPlayerId(pid);
        long leetHard = leetcodeRepository.countByPlayerIdAndDifficulty(pid, "HARD");
        long habitCount = habitRepository.countByPlayerIdAndArchivedFalse(pid);

        // ── Level milestones ──
        if (level >= 5)  tryUnlock(pid, "LEVEL_5",  "Rookie Hunter",    "Reach Level 5", unlocked);
        if (level >= 10) tryUnlock(pid, "LEVEL_10", "Seasoned Hunter",  "Reach Level 10", unlocked);
        if (level >= 15) tryUnlock(pid, "LEVEL_15", "Veteran Hunter",   "Reach Level 15", unlocked);
        if (level >= 20) tryUnlock(pid, "LEVEL_20", "Elite Hunter",     "Reach Level 20", unlocked);
        if (level >= 25) tryUnlock(pid, "LEVEL_25", "Master Hunter",    "Reach Level 25", unlocked);
        if (level >= 30) tryUnlock(pid, "LEVEL_30", "Grandmaster",      "Reach Level 30", unlocked);
        if (level >= 35) tryUnlock(pid, "LEVEL_35", "Warlord",          "Reach Level 35", unlocked);
        if (level >= 40) tryUnlock(pid, "LEVEL_40", "Ascendant",        "Reach Level 40", unlocked);
        if (level >= 45) tryUnlock(pid, "LEVEL_45", "Sovereign",        "Reach Level 45", unlocked);
        if (level >= 50) tryUnlock(pid, "LEVEL_50", "Monarch's Equal",  "Reach Level 50", unlocked);

        // ── Total XP milestones ──
        if (totalXp >= 1000)   tryUnlock(pid, "XP_1K",   "Grinder",     "Earn 1,000 total XP", unlocked);
        if (totalXp >= 5000)   tryUnlock(pid, "XP_5K",   "Relentless",  "Earn 5,000 total XP", unlocked);
        if (totalXp >= 10000)  tryUnlock(pid, "XP_10K",  "Unstoppable", "Earn 10,000 total XP", unlocked);
        if (totalXp >= 25000)  tryUnlock(pid, "XP_25K",  "Machine",     "Earn 25,000 total XP", unlocked);
        if (totalXp >= 50000)  tryUnlock(pid, "XP_50K",  "Legend",      "Earn 50,000 total XP", unlocked);
        if (totalXp >= 100000) tryUnlock(pid, "XP_100K", "Mythic",      "Earn 100,000 total XP", unlocked);
        if (totalXp >= 250000) tryUnlock(pid, "XP_250K", "Transcendent","Earn 250,000 total XP", unlocked);

        // ── Rank milestones (D & C handled above) ──
        if (rankAtLeast(rank, "B")) tryUnlock(pid, "RANK_UP_B", "B-Rank Hunter",         "Reach B-Rank", unlocked);
        if (rankAtLeast(rank, "A")) tryUnlock(pid, "RANK_UP_A", "A-Rank Hunter",         "Reach A-Rank", unlocked);
        if (rankAtLeast(rank, "S")) tryUnlock(pid, "RANK_UP_S", "S-Rank — Shadow Monarch","Reach S-Rank", unlocked);

        // ── Total quests completed ──
        if (totalQuests >= 10)   tryUnlock(pid, "QUESTS_10",   "Getting Started", "Complete 10 quests", unlocked);
        if (totalQuests >= 50)   tryUnlock(pid, "QUESTS_50",   "Committed",       "Complete 50 quests", unlocked);
        if (totalQuests >= 100)  tryUnlock(pid, "QUESTS_100",  "Centurion",       "Complete 100 quests", unlocked);
        if (totalQuests >= 250)  tryUnlock(pid, "QUESTS_250",  "Disciplined",     "Complete 250 quests", unlocked);
        if (totalQuests >= 500)  tryUnlock(pid, "QUESTS_500",  "Iron Will",       "Complete 500 quests", unlocked);
        if (totalQuests >= 1000) tryUnlock(pid, "QUESTS_1000", "The 1000 Club",   "Complete 1,000 quests", unlocked);
        if (totalQuests >= 2000) tryUnlock(pid, "QUESTS_2000", "Machine God",     "Complete 2,000 quests", unlocked);

        // ── Active-day milestones ──
        if (activeDays >= 7)   tryUnlock(pid, "ACTIVE_7",   "One Week Strong",       "Be active on 7 different days", unlocked);
        if (activeDays >= 30)  tryUnlock(pid, "ACTIVE_30",  "One Month In",          "Be active on 30 different days", unlocked);
        if (activeDays >= 100) tryUnlock(pid, "ACTIVE_100", "Century of Grind",      "Be active on 100 different days", unlocked);
        if (activeDays >= 200) tryUnlock(pid, "ACTIVE_200", "Consistency Incarnate", "Be active on 200 different days", unlocked);
        if (activeDays >= 365) tryUnlock(pid, "ACTIVE_365", "The Year of Leveling",  "Be active on 365 different days", unlocked);

        // ── Vitality ──
        if (player.getHp() >= player.getMaxHp())
            tryUnlock(pid, "FULL_HP", "Peak Vitality", "Reach full HP", unlocked);

        // ── LeetCode (real Career-OS logs) ──
        if (leetTotal >= 10)  tryUnlock(pid, "LC_LOG_10",  "Problem Solver",  "Log 10 LeetCode problems", unlocked);
        if (leetTotal >= 50)  tryUnlock(pid, "LC_LOG_50",  "Algorithm Adept", "Log 50 LeetCode problems", unlocked);
        if (leetTotal >= 100) tryUnlock(pid, "LC_LOG_100", "DSA Machine",     "Log 100 LeetCode problems", unlocked);
        if (leetTotal >= 200) tryUnlock(pid, "LC_LOG_200", "LeetCode Legend", "Log 200 LeetCode problems", unlocked);
        if (leetHard >= 10)   tryUnlock(pid, "LC_HARD_10",  "Hard Mode",      "Solve 10 HARD problems", unlocked);
        if (leetHard >= 25)   tryUnlock(pid, "LC_HARD_25",  "Fearless",       "Solve 25 HARD problems", unlocked);
        if (leetHard >= 50)   tryUnlock(pid, "LC_HARD_50",  "Nightmare Slayer","Solve 50 HARD problems", unlocked);

        // ── Long discipline streaks (30-day+) ──
        if (consecutiveDays(pid, "COLD_SHOWER", today) >= 30) tryUnlock(pid, "COLD_30",   "Ice Monarch",     "Cold shower 30 days straight", unlocked);
        if (consecutiveDays(pid, "NO_PORN", today)     >= 30) tryUnlock(pid, "NOPORN_30", "Monk Mode",       "NO_PORN 30 days straight", unlocked);
        if (consecutiveDays(pid, "NO_PORN", today)     >= 60) tryUnlock(pid, "NOPORN_60", "Steel Discipline","NO_PORN 60 days straight", unlocked);
        if (consecutiveDays(pid, "NO_PORN", today)     >= 90) tryUnlock(pid, "NOPORN_90", "Reborn",          "NO_PORN 90 days straight", unlocked);
        if (consecutiveDays(pid, "MORNING_SUN", today) >= 30) tryUnlock(pid, "SUN_30",    "Sun Disciple",    "Morning sunlight 30 days straight", unlocked);
        if (consecutiveDays(pid, "NO_SODA", today)     >= 30) tryUnlock(pid, "NOSODA_30", "Clean Machine",   "No soda 30 days straight", unlocked);
        if (consecutiveDays(pid, "CODE_NO_AI", today)  >= 10) tryUnlock(pid, "NOAI_10",   "Sharpening Steel","Code without AI 10 days straight", unlocked);
        if (consecutiveDays(pid, "CODE_NO_AI", today)  >= 30) tryUnlock(pid, "NOAI_30",   "Raw Skill",       "Code without AI 30 days straight", unlocked);

        // ── Atomic Habits engine ──
        if (habitCount >= 1)  tryUnlock(pid, "FIRST_HABIT", "Habit Seed",       "Create your first habit", unlocked);
        if (habitCount >= 3)  tryUnlock(pid, "HABIT_3",     "Routine Builder",  "Run 3 active habits", unlocked);
        if (habitCount >= 5)  tryUnlock(pid, "HABIT_5",     "System Architect", "Run 5 active habits", unlocked);
        if (habitCount >= 10) tryUnlock(pid, "HABIT_10",    "Habit Master",     "Run 10 active habits", unlocked);
        if (hasKeystoneHabit(pid))
            tryUnlock(pid, "KEYSTONE", "Keystone Bearer", "Maintain a keystone habit", unlocked);

        return unlocked;
    }

    private boolean rankAtLeast(String rank, String target) {
        List<String> order = List.of("E", "D", "C", "B", "A", "S");
        return order.indexOf(rank) >= order.indexOf(target);
    }

    private long countQuest(Long playerId, String questKey) {
        return questRepository.findByQuestKey(questKey)
                .map(q -> completionRepository.countByPlayerIdAndQuestId(playerId, q.getId()))
                .orElse(0L);
    }

    private int consecutiveDays(Long playerId, String questKey, LocalDate today) {
        Optional<Quest> quest = questRepository.findByQuestKey(questKey);
        if (quest.isEmpty()) return 0;
        Long qid = quest.get().getId();
        Set<LocalDate> dates = completionRepository
                .findByPlayerIdOrderByCompletedAtDesc(playerId).stream()
                .filter(c -> c.getQuestId().equals(qid))
                .map(QuestCompletion::getCompletedAt)
                .collect(Collectors.toSet());
        int streak = 0;
        LocalDate cursor = today;
        while (dates.contains(cursor)) {
            streak++;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }

    private boolean allTestosteroneToday(Long playerId, LocalDate today) {
        Set<Long> testoQuestIds = questRepository.findAll().stream()
                .filter(q -> q.getCategory().name().equals("TESTOSTERONE"))
                .map(Quest::getId).collect(Collectors.toSet());
        if (testoQuestIds.isEmpty()) return false;
        Set<Long> doneToday = completionRepository
                .findByPlayerIdAndCompletedAt(playerId, today).stream()
                .map(QuestCompletion::getQuestId).collect(Collectors.toSet());
        return doneToday.containsAll(testoQuestIds);
    }

    /** Number of distinct calendar days on which the player completed any quest. */
    private int distinctActiveDays(Long playerId) {
        return (int) completionRepository.findByPlayerIdOrderByCompletedAtDesc(playerId).stream()
                .map(QuestCompletion::getCompletedAt)
                .distinct()
                .count();
    }

    private boolean hasKeystoneHabit(Long playerId) {
        return habitRepository.findByPlayerIdOrderByCreatedAtAsc(playerId).stream()
                .anyMatch(h -> h.isKeystone() && !h.isArchived());
    }

    private void tryUnlock(Long playerId, String key, String title, String desc,
                           List<AchievementDTO> collector) {
        if (!achievementRepository.existsByPlayerIdAndAchievementKey(playerId, key)) {
            Achievement a = achievementRepository.save(
                    new Achievement(playerId, key, title, desc));
            collector.add(toDto(a));
        }
    }

    private AchievementDTO toDto(Achievement a) {
        return new AchievementDTO(a.getId(), a.getAchievementKey(), a.getTitle(),
                a.getDescription(), a.getUnlockedAt().toString());
    }
}

