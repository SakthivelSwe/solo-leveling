package com.thesystem.service;

import com.thesystem.dto.AchievementDTO;
import com.thesystem.entity.Achievement;
import com.thesystem.entity.Player;
import com.thesystem.entity.Quest;
import com.thesystem.entity.QuestCompletion;
import com.thesystem.repository.AchievementRepository;
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

    public AchievementService(AchievementRepository achievementRepository,
                              QuestCompletionRepository completionRepository,
                              QuestRepository questRepository) {
        this.achievementRepository = achievementRepository;
        this.completionRepository = completionRepository;
        this.questRepository = questRepository;
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

