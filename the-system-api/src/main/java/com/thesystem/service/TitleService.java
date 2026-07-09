package com.thesystem.service;

import com.thesystem.dto.TitleDTO;
import com.thesystem.entity.Player;
import com.thesystem.entity.PlayerStats;
import com.thesystem.exception.ApiException;
import com.thesystem.repository.PlayerRepository;
import com.thesystem.repository.PlayerStatsRepository;
import com.thesystem.repository.HabitCompletionRepository;
import com.thesystem.repository.HabitRepository;
import com.thesystem.repository.QuestCompletionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Title system — unlockable Solo-Leveling-style titles the Hunter earns and equips.
 * Titles are derived live from the player's rank, stats, streaks and quest count
 * (no extra table needed); the equipped choice is persisted on the Player.
 */
@Service
public class TitleService {

    private record TitleDef(String key, String name, String description) {}

    private static final List<TitleDef> CATALOG = List.of(
        new TitleDef("AWAKENED",       "The Awakened",    "You answered the System's call."),
        new TitleDef("IRON_WILLED",    "Iron-Willed",     "Forged a 7-day streak. Discipline rising."),
        new TitleDef("RELENTLESS",     "The Relentless",  "A 30-day streak, unbroken. Machine-like."),
        new TitleDef("CODE_HUNTER",    "Code Hunter",     "INT sharpened to 40+. The mind is a weapon."),
        new TitleDef("SHADOW_ATHLETE", "Shadow Athlete",  "STR raised to 40+. The body obeys."),
        new TitleDef("HORMONE_LORD",   "Hormone Lord",    "HOR mastered to 40+. Primal power."),
        new TitleDef("GATE_BREAKER",   "Gate Breaker",    "Cleared 100 total quests."),
        new TitleDef("DECORATED",      "The Decorated",   "Unlocked 5 achievements."),
        new TitleDef("DAWN_HUNTER",    "Dawn Hunter",     "Rose to C-Rank — interview-ready."),
        new TitleDef("ELITE_HUNTER",   "Elite Hunter",    "Reached B-Rank. Among the strong."),
        new TitleDef("SHADOW_MONARCH", "Shadow Monarch",  "S-Rank. The apex. The System bows."),
        // === Habit-mastery titles (Atomic Habits engine) ===
        new TitleDef("THE_CONSISTENT",  "The Consistent",  "Held a habit streak for 21 days."),
        new TitleDef("IRON_DISCIPLINE", "Iron Discipline", "Mastered a habit — 66-day streak."),
        new TitleDef("IDENTITY_SHIFTER","Identity Shifter","Reached 60%+ mastery on 3 habits of the same identity."),
        new TitleDef("KEYSTONE_BEARER", "Keystone Bearer", "Held 3 keystone habits active with 7+ day streaks."),
        new TitleDef("ONE_PERCENT",     "1% Better",       "Completed 100 habit-check-ins — compounding begins."),
        new TitleDef("NEVER_MISS_TWICE","Never Miss Twice","Used the 2-minute rule to save a streak. Discipline over perfection.")
    );

    private final PlayerRepository playerRepository;
    private final PlayerStatsRepository statsRepository;
    private final QuestCompletionRepository completionRepository;
    private final AchievementService achievementService;
    private final PlayerService playerService;
    private final HabitRepository habitRepository;
    private final HabitCompletionRepository habitCompletionRepository;

    public TitleService(PlayerRepository playerRepository,
                        PlayerStatsRepository statsRepository,
                        QuestCompletionRepository completionRepository,
                        AchievementService achievementService,
                        PlayerService playerService,
                        HabitRepository habitRepository,
                        HabitCompletionRepository habitCompletionRepository) {
        this.playerRepository = playerRepository;
        this.statsRepository = statsRepository;
        this.completionRepository = completionRepository;
        this.achievementService = achievementService;
        this.playerService = playerService;
        this.habitRepository = habitRepository;
        this.habitCompletionRepository = habitCompletionRepository;
    }

    public List<TitleDTO> getTitles(Long playerId) {
        Player p = find(playerId);
        PlayerStats s = statsRepository.findByPlayerId(playerId)
                .orElseThrow(() -> new ApiException("Stats not found", HttpStatus.NOT_FOUND));

        int rankIdx = rankIndex(p.getRankLevel());
        int longest = playerService.longestStreak(playerId);
        long totalQuests = completionRepository.countByPlayerId(playerId);
        int achievements = achievementService.getPlayerAchievements(playerId).size();
        String equipped = p.getEquippedTitle();

        // Habit metrics (cheap: one list + set math)
        HabitStats hs = computeHabitStats(playerId);

        List<TitleDTO> out = new ArrayList<>();
        for (TitleDef d : CATALOG) {
            boolean unlocked = isUnlocked(d.key(), rankIdx, longest, totalQuests, achievements, s, hs);
            out.add(new TitleDTO(d.key(), d.name(), d.description(), unlocked, d.key().equals(equipped)));
        }
        return out;
    }

    public List<TitleDTO> equip(Long playerId, String key) {
        Player p = find(playerId);
        TitleDTO match = getTitles(playerId).stream()
                .filter(t -> t.key().equals(key))
                .findFirst()
                .orElseThrow(() -> new ApiException("Title not found: " + key, HttpStatus.NOT_FOUND));
        if (!match.unlocked()) {
            throw new ApiException("Title is still locked", HttpStatus.FORBIDDEN);
        }
        p.setEquippedTitle(key);
        playerRepository.save(p);
        return getTitles(playerId);
    }

    private boolean isUnlocked(String key, int rankIdx, int longest, long totalQuests,
                               int achievements, PlayerStats s, HabitStats hs) {
        return switch (key) {
            case "AWAKENED"       -> true;
            case "IRON_WILLED"    -> longest >= 7;
            case "RELENTLESS"     -> longest >= 30;
            case "CODE_HUNTER"    -> s.getIntelligence() >= 40;
            case "SHADOW_ATHLETE" -> s.getStrength() >= 40;
            case "HORMONE_LORD"   -> s.getHor() >= 40;
            case "GATE_BREAKER"   -> totalQuests >= 100;
            case "DECORATED"      -> achievements >= 5;
            case "DAWN_HUNTER"    -> rankIdx >= 2;
            case "ELITE_HUNTER"   -> rankIdx >= 3;
            case "SHADOW_MONARCH" -> rankIdx >= 5;
            // Habit titles
            case "THE_CONSISTENT"   -> hs.longestHabit >= 21;
            case "IRON_DISCIPLINE"  -> hs.longestHabit >= 66;
            case "IDENTITY_SHIFTER" -> hs.identityMastered;
            case "KEYSTONE_BEARER"  -> hs.keystonesWithStreak >= 3;
            case "ONE_PERCENT"      -> hs.totalCompletions >= 100;
            case "NEVER_MISS_TWICE" -> hs.twoMinuteRescues >= 1;
            default -> false;
        };
    }

    /** Snapshot of habit metrics used by the title unlock rules. */
    private record HabitStats(int longestHabit, int keystonesWithStreak,
                              long totalCompletions, boolean identityMastered,
                              int twoMinuteRescues) {}

    private HabitStats computeHabitStats(Long playerId) {
        var habits = habitRepository.findByPlayerIdOrderByCreatedAtAsc(playerId);
        if (habits.isEmpty()) return new HabitStats(0, 0, 0, false, 0);

        var allCompletions = habitCompletionRepository
                .findByPlayerIdAndCompletedAtBetween(playerId,
                        java.time.LocalDate.now().minusYears(2), java.time.LocalDate.now());

        // Group by habit → sorted set of dates
        java.util.Map<Long, java.util.Set<java.time.LocalDate>> byHabit = new java.util.HashMap<>();
        int twoMinuteRescues = 0;
        for (var c : allCompletions) {
            byHabit.computeIfAbsent(c.getHabitId(), k -> new java.util.HashSet<>()).add(c.getCompletedAt());
            if (c.isTwoMinute()) twoMinuteRescues++;
        }

        int longestOverall = 0;
        int keystonesWithStreak = 0;
        java.util.Map<String, java.util.List<Integer>> perTagMastery = new java.util.HashMap<>();

        for (var h : habits) {
            var days = byHabit.getOrDefault(h.getId(), java.util.Set.of());
            int longest = longestRun(days);
            longestOverall = Math.max(longestOverall, longest);
            if (h.isKeystone() && longest >= 7 && !h.isArchived()) keystonesWithStreak++;
            if (h.getIdentityTag() != null && !h.getIdentityTag().isBlank()) {
                perTagMastery.computeIfAbsent(h.getIdentityTag(), k -> new java.util.ArrayList<>())
                        .add(Math.min(100, longest * 100 / 66));
            }
        }

        boolean identityMastered = perTagMastery.values().stream()
                .anyMatch(list -> list.size() >= 3
                        && list.stream().filter(v -> v >= 60).count() >= 3);

        return new HabitStats(longestOverall, keystonesWithStreak,
                allCompletions.size(), identityMastered, twoMinuteRescues);
    }

    private int longestRun(java.util.Set<java.time.LocalDate> days) {
        int best = 0;
        for (var d : days) {
            if (!days.contains(d.minusDays(1))) {
                int run = 0; var c = d;
                while (days.contains(c)) { run++; c = c.plusDays(1); }
                best = Math.max(best, run);
            }
        }
        return best;
    }

    private int rankIndex(String rank) {
        return switch (rank == null ? "E" : rank) {
            case "D" -> 1; case "C" -> 2; case "B" -> 3; case "A" -> 4; case "S" -> 5;
            default -> 0;
        };
    }

    private Player find(Long playerId) {
        return playerRepository.findById(playerId)
                .orElseThrow(() -> new ApiException("Player not found", HttpStatus.NOT_FOUND));
    }
}

