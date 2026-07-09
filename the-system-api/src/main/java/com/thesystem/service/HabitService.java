package com.thesystem.service;

import com.thesystem.dto.*;
import com.thesystem.entity.Habit;
import com.thesystem.entity.HabitCompletion;
import com.thesystem.entity.Player;
import com.thesystem.exception.ApiException;
import com.thesystem.repository.HabitCompletionRepository;
import com.thesystem.repository.HabitRepository;
import com.thesystem.repository.PlayerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Habit engine — implements the Atomic Habits 4-Laws loop + Power of Habit
 * cue/routine/reward + identity-based habit change.
 *
 *  XP formula: base 5 × difficulty × (keystone ? 2 : 1) × streak-tier bonus
 *  Two-minute completion: half XP but keeps streak alive (never miss twice)
 *  Mastery: 66 days = 100% (based on Phillippa Lally's habit-formation study cited in Atomic Habits)
 */
@Service
public class HabitService {

    private static final int MASTERY_DAYS = 66;
    private static final int BASE_XP = 5;

    private final HabitRepository habitRepository;
    private final HabitCompletionRepository completionRepository;
    private final PlayerRepository playerRepository;
    private final LevelService levelService;
    private final SseService sseService;

    public HabitService(HabitRepository habitRepository,
                        HabitCompletionRepository completionRepository,
                        PlayerRepository playerRepository,
                        LevelService levelService,
                        SseService sseService) {
        this.habitRepository = habitRepository;
        this.completionRepository = completionRepository;
        this.playerRepository = playerRepository;
        this.levelService = levelService;
        this.sseService = sseService;
    }

    // ---------- Read ----------

    public HabitsOverviewDTO overview(Long playerId) {
        List<Habit> habits = habitRepository
                .findByPlayerIdAndArchivedFalseOrderByKeystoneDescCreatedAtAsc(playerId);
        LocalDate today = LocalDate.now();
        DayOfWeek dow = today.getDayOfWeek();

        // Pre-fetch last 30 days of completions once (avoid N+1).
        LocalDate window = today.minusDays(29);
        Map<Long, List<HabitCompletion>> byHabit = completionRepository
                .findByPlayerIdAndCompletedAtBetween(playerId, window, today).stream()
                .collect(Collectors.groupingBy(HabitCompletion::getHabitId));

        List<HabitDTO> dtos = habits.stream()
                .map(h -> toDto(h, today, byHabit.getOrDefault(h.getId(), List.of())))
                .toList();

        int dueToday = (int) habits.stream().filter(h -> isDueOn(h, dow)).count();
        int completedToday = (int) dtos.stream().filter(HabitDTO::completedToday).count();
        int longestGlobal = dtos.stream().mapToInt(HabitDTO::longestStreak).max().orElse(0);
        int totalCompletions = (int) completionRepository.countByPlayerId(playerId);

        // 1% compounding vs 1% decay curve (based on days since first habit)
        int daysActive = habits.isEmpty() ? 0 :
                (int) java.time.temporal.ChronoUnit.DAYS.between(
                        habits.stream().map(Habit::getCreatedAt)
                                .min(Comparator.naturalOrder()).get().toLocalDate(),
                        today) + 1;
        double compound = Math.pow(1.01, daysActive);
        double decay    = Math.pow(0.99, daysActive);

        // Identity scores: avg mastery across habits per identity tag
        Map<String, List<Double>> perTag = new HashMap<>();
        for (HabitDTO d : dtos) {
            if (d.identityTag() == null || d.identityTag().isBlank()) continue;
            perTag.computeIfAbsent(d.identityTag(), k -> new ArrayList<>()).add(d.masteryPct());
        }
        Map<String, Integer> identityScores = new LinkedHashMap<>();
        perTag.forEach((tag, vals) -> identityScores.put(tag,
                (int) Math.round(vals.stream().mapToDouble(Double::doubleValue).average().orElse(0))));

        return new HabitsOverviewDTO(dtos, dueToday, completedToday, longestGlobal,
                totalCompletions, compound, decay, identityScores, verdict(dtos, dueToday, completedToday));
    }

    public List<HabitDTO> list(Long playerId) {
        return overview(playerId).habits();
    }

    // ---------- Write ----------

    @Transactional
    public HabitDTO create(Long playerId, Habit input) {
        input.setId(null);
        input.setPlayerId(playerId);
        input.setArchived(false);
        Habit saved = habitRepository.save(input);
        return toDto(saved, LocalDate.now(), List.of());
    }

    @Transactional
    public HabitDTO update(Long playerId, Long habitId, Habit patch) {
        Habit h = ownedOrThrow(playerId, habitId);
        if (patch.getName() != null) h.setName(patch.getName());
        if (patch.getIdentityTag() != null) h.setIdentityTag(patch.getIdentityTag());
        if (patch.getCue() != null) h.setCue(patch.getCue());
        if (patch.getCraving() != null) h.setCraving(patch.getCraving());
        if (patch.getRoutine() != null) h.setRoutine(patch.getRoutine());
        if (patch.getReward() != null) h.setReward(patch.getReward());
        if (patch.getTwoMinuteVersion() != null) h.setTwoMinuteVersion(patch.getTwoMinuteVersion());
        if (patch.getCueTime() != null) h.setCueTime(patch.getCueTime());
        if (patch.getCueLocation() != null) h.setCueLocation(patch.getCueLocation());
        if (patch.getStackAfterHabitId() != null) h.setStackAfterHabitId(patch.getStackAfterHabitId());
        if (patch.getDifficulty() > 0) h.setDifficulty(patch.getDifficulty());
        if (patch.getActiveDays() > 0) h.setActiveDays(patch.getActiveDays());
        h.setKeystone(patch.isKeystone());
        Habit saved = habitRepository.save(h);
        return toDto(saved, LocalDate.now(),
                completionRepository.findByHabitIdOrderByCompletedAtDesc(habitId));
    }

    @Transactional
    public void archive(Long playerId, Long habitId) {
        Habit h = ownedOrThrow(playerId, habitId);
        h.setArchived(true);
        habitRepository.save(h);
    }

    @Transactional
    public HabitCompletionResult complete(Long playerId, Long habitId, int quality,
                                          boolean twoMinute, String note) {
        Habit h = ownedOrThrow(playerId, habitId);
        LocalDate today = LocalDate.now();
        if (completionRepository.existsByPlayerIdAndHabitIdAndCompletedAt(playerId, habitId, today)) {
            throw new ApiException("Habit already completed today", HttpStatus.CONFLICT);
        }

        int q = Math.max(1, Math.min(5, quality));
        int streakBefore = currentStreak(habitId, today.minusDays(1));
        int streakAfter = streakBefore + 1;
        int streakBonus = 1 + Math.min(streakAfter / 7, 5); // +1 every 7 days, capped +5

        int xp = twoMinute
                ? Math.max(1, (BASE_XP * h.getDifficulty()) / 2)
                : BASE_XP * h.getDifficulty() * (h.isKeystone() ? 2 : 1) * streakBonus;

        completionRepository.save(new HabitCompletion(playerId, habitId, today,
                q, xp, twoMinute, note));

        // Award XP + level check
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new ApiException("Player not found", HttpStatus.NOT_FOUND));
        player.setCurrentXp(player.getCurrentXp() + xp);
        player.setTotalXp(player.getTotalXp() + xp);
        LevelUpDTO up = levelService.checkLevelUp(player);
        playerRepository.save(player);

        int newLongest = Math.max(longestStreak(habitId), streakAfter);

        // Real-time push to every open tab.
        sseService.send(playerId, "habit-update", Map.of(
                "habitId", habitId,
                "streak", streakAfter,
                "xpGained", xp,
                "currentXp", player.getCurrentXp(),
                "totalXp", player.getTotalXp(),
                "level", player.getLevel(),
                "rankLevel", player.getRankLevel()));

        return new HabitCompletionResult(habitId, h.getName(), xp, streakAfter, newLongest,
                twoMinute, h.isKeystone(), up.leveledUp(), up.newLevel(), up.newRank(),
                up.rankChanged(), completionMessage(h, streakAfter, twoMinute));
    }

    // ---------- Helpers ----------

    private String completionMessage(Habit h, int streak, boolean twoMinute) {
        if (twoMinute) return "◈ Two-minute rule engaged. Streak preserved. Never miss twice.";
        if (streak == 1) return "◈ Vote cast for the identity you want.";
        if (streak == 7) return "◈ 7-day streak. Iron discipline forming.";
        if (streak == 21) return "◈ 21 days. The routine now owns you — not the other way around.";
        if (streak == 66) return "◈ 66 DAYS. Habit mastered. Identity shifted. THE SYSTEM acknowledges.";
        if (streak % 30 == 0) return "◈ " + streak + " days. 1% compounding is unstoppable.";
        return "◈ +" + h.getName() + " streak: " + streak + " days.";
    }

    private String verdict(List<HabitDTO> dtos, int due, int done) {
        if (dtos.isEmpty()) return "No habits yet. Vote for your future identity — add your first keystone.";
        if (due == 0) return "◈ Rest cycle. Return tomorrow, Hunter.";
        if (done == due) return "◈ PERFECT DISCIPLINE DAY. Identity vote cast: STRONG.";
        if (done == 0) return "◈ THE SYSTEM IS WATCHING. Zero habits completed today.";
        double pct = (double) done / due;
        if (pct >= 0.7) return "◈ Strong day. Push through the remaining habits.";
        return "◈ Progress detected. " + (due - done) + " habits still open.";
    }

    private HabitDTO toDto(Habit h, LocalDate today, List<HabitCompletion> recent) {
        Set<LocalDate> doneDates = recent.stream()
                .map(HabitCompletion::getCompletedAt)
                .collect(Collectors.toSet());
        Map<LocalDate, HabitCompletion> byDate = recent.stream()
                .collect(Collectors.toMap(HabitCompletion::getCompletedAt, c -> c, (a, b) -> a));

        boolean completedToday = doneDates.contains(today);
        int current = currentStreak(h.getId(), today);
        int longest = longestStreak(h.getId());
        long total = completionRepository.countByHabitId(h.getId());

        // 30-day mini-heat
        List<Integer> last30 = new ArrayList<>(30);
        int hit30 = 0;
        for (int i = 29; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            HabitCompletion c = byDate.get(d);
            if (c == null) last30.add(0);
            else { last30.add(c.isTwoMinute() ? 2 : 1); hit30++; }
        }
        double consistency = hit30 * 100.0 / 30.0;
        double mastery = Math.min(100.0, longest * 100.0 / MASTERY_DAYS);

        return new HabitDTO(h.getId(), h.getName(), h.getIdentityTag(),
                h.getCue(), h.getCraving(), h.getRoutine(), h.getReward(),
                h.getTwoMinuteVersion(), h.getStackAfterHabitId(),
                h.getCueTime(), h.getCueLocation(), h.getDifficulty(), h.isKeystone(),
                h.getActiveDays(), h.isArchived(),
                completedToday, current, longest, (int) total,
                Math.round(consistency * 10) / 10.0, Math.round(mastery * 10) / 10.0, last30);
    }

    private int currentStreak(Long habitId, LocalDate anchor) {
        List<HabitCompletion> all = completionRepository.findByHabitIdOrderByCompletedAtDesc(habitId);
        Set<LocalDate> days = all.stream().map(HabitCompletion::getCompletedAt).collect(Collectors.toSet());
        LocalDate cursor = anchor;
        int streak = 0;
        // If anchor not done, streak still counts if yesterday was (grace).
        if (!days.contains(cursor)) cursor = cursor.minusDays(1);
        while (days.contains(cursor)) { streak++; cursor = cursor.minusDays(1); }
        return streak;
    }

    private int longestStreak(Long habitId) {
        Set<LocalDate> days = completionRepository.findByHabitIdOrderByCompletedAtDesc(habitId).stream()
                .map(HabitCompletion::getCompletedAt).collect(Collectors.toSet());
        int best = 0;
        for (LocalDate d : days) {
            if (!days.contains(d.minusDays(1))) {
                int run = 0; LocalDate c = d;
                while (days.contains(c)) { run++; c = c.plusDays(1); }
                best = Math.max(best, run);
            }
        }
        return best;
    }

    private boolean isDueOn(Habit h, DayOfWeek dow) {
        int bit = 1 << (dow.getValue() - 1); // Mon=1 → bit0
        return (h.getActiveDays() & bit) != 0;
    }

    private Habit ownedOrThrow(Long playerId, Long habitId) {
        Habit h = habitRepository.findById(habitId)
                .orElseThrow(() -> new ApiException("Habit not found", HttpStatus.NOT_FOUND));
        if (!h.getPlayerId().equals(playerId)) {
            throw new ApiException("Not your habit", HttpStatus.FORBIDDEN);
        }
        return h;
    }
}

