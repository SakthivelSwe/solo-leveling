package com.thesystem.service;

import com.thesystem.entity.AiMemoryEntry;
import com.thesystem.repository.AiMemoryRepository;
import com.thesystem.repository.QuestCompletionRepository;
import com.thesystem.repository.QuestRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import com.thesystem.repository.PlayerRepository;
import com.thesystem.entity.Player;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

/**
 * AI Memory Service — generates weekly behavioral summaries and injects them
 * into the AI Mentor prompt for personalized, context-aware coaching.
 *
 * Runs every Sunday at 23:30 IST to analyze the week just ending.
 * Keeps a rolling 4-week window (older entries are pruned).
 *
 * Memory types:
 *   SKIP         — quest skipped ≥ 2 times this week
 *   STREAK       — quest completed every day this week (perfect week)
 *   IMPROVEMENT  — quest completion rate improved vs prior week
 *   DECLINE      — quest completion rate declined vs prior week
 *   BEHAVIORAL   — general pattern (e.g., "3 days with > 60 dopamine score")
 */
@Service
public class AiMemoryService {

    private final AiMemoryRepository memoryRepository;
    private final QuestCompletionRepository completionRepository;
    private final QuestRepository questRepository;
    private final PlayerRepository playerRepository;

    public AiMemoryService(AiMemoryRepository memoryRepository,
                           QuestCompletionRepository completionRepository,
                           QuestRepository questRepository,
                           PlayerRepository playerRepository) {
        this.memoryRepository = memoryRepository;
        this.completionRepository = completionRepository;
        this.questRepository = questRepository;
        this.playerRepository = playerRepository;
    }

    /**
     * Generates memory entries for the week that just ended.
     * Scheduled: every Sunday at 23:30 IST.
     */
    @Scheduled(cron = "0 30 23 * * SUN", zone = "${thesystem.scheduler.timezone}")
    @Transactional
    public void generateWeeklyMemories() {
        LocalDate weekStart = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate weekEnd = LocalDate.now();

        List<Player> players = playerRepository.findAll();
        for (Player player : players) {
            generateForPlayer(player.getId(), weekStart, weekEnd);
        }
    }

    /** Generate memories for a specific player for a given week. Public for on-demand calls. */
    @Transactional
    public void generateForPlayer(Long playerId, LocalDate weekStart, LocalDate weekEnd) {
        // Prune entries older than 4 weeks
        memoryRepository.deleteOlderThan(playerId, weekStart.minusWeeks(4));

        List<com.thesystem.entity.QuestCompletion> completions =
                completionRepository.findByPlayerIdAndCompletedAtBetween(playerId, weekStart, weekEnd);

        // Count completions per quest key this week
        Map<String, Long> countByKey = completions.stream()
                .collect(Collectors.groupingBy(c -> {
                    return questRepository.findById(c.getQuestId())
                            .map(q -> q.getQuestKey()).orElse("UNKNOWN");
                }, Collectors.counting()));

        int daysInWeek = (int) (weekStart.until(weekEnd).getDays() + 1);
        List<AiMemoryEntry> entries = new ArrayList<>();

        // Check all active quests for skip/streak patterns
        questRepository.findByActiveTrueOrderByCategoryAscXpRewardDesc().forEach(quest -> {
            long count = countByKey.getOrDefault(quest.getQuestKey(), 0L);

            if (count == 0 && quest.isCritical()) {
                // Critical quest skipped all week — highest priority memory
                entries.add(entry(playerId, "SKIP", quest.getQuestKey(), weekStart,
                        "Skipped " + quest.getLabel() + " ALL WEEK. This is your critical quest."));
            } else if (count > 0 && count < 3 && quest.isCritical()) {
                entries.add(entry(playerId, "SKIP", quest.getQuestKey(), weekStart,
                        "Only completed " + quest.getLabel() + " " + count + " time(s) this week."));
            } else if (count >= daysInWeek) {
                entries.add(entry(playerId, "STREAK", quest.getQuestKey(), weekStart,
                        "Perfect week on " + quest.getLabel() + ". Streak unbroken."));
            }
        });

        // General pattern: if < 5 quests per day on average, flag it
        int totalCompletions = completions.size();
        double avgPerDay = (double) totalCompletions / Math.max(1, daysInWeek);
        if (avgPerDay < 4) {
            entries.add(entry(playerId, "BEHAVIORAL", null, weekStart,
                    String.format("Averaged only %.1f quests per day this week. Far below the 7+ target.", avgPerDay)));
        } else if (avgPerDay >= 8) {
            entries.add(entry(playerId, "BEHAVIORAL", null, weekStart,
                    String.format("Averaged %.1f quests per day. Strong week. Maintain it.", avgPerDay)));
        }

        memoryRepository.saveAll(entries);
    }

    /**
     * Returns the last 4 weeks of memory formatted as a prompt-injectable string.
     * Called by AiMentorService to build personalized context.
     */
    public String buildMemoryContext(Long playerId) {
        LocalDate cutoff = LocalDate.now().minusWeeks(4);
        List<AiMemoryEntry> entries =
                memoryRepository.findByPlayerIdAndWeekStartGreaterThanEqualOrderByWeekStartDesc(
                        playerId, cutoff);
        if (entries.isEmpty()) return "";

        StringBuilder sb = new StringBuilder("\nRecent memory (last 4 weeks):\n");
        entries.forEach(e -> sb.append("- ").append(e.getValue()).append("\n"));
        return sb.toString();
    }

    private AiMemoryEntry entry(Long playerId, String type, String questKey,
                                LocalDate weekStart, String value) {
        AiMemoryEntry e = new AiMemoryEntry();
        e.setPlayerId(playerId);
        e.setMemoryType(type);
        e.setQuestKey(questKey);
        e.setWeekStart(weekStart);
        e.setValue(value);
        return e;
    }
}
