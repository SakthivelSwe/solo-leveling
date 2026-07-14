package com.thesystem.service;

import com.thesystem.dto.*;
import com.thesystem.entity.Player;
import com.thesystem.entity.PlayerStats;
import com.thesystem.entity.QuestCompletion;
import com.thesystem.exception.ApiException;
import com.thesystem.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final PlayerStatsRepository statsRepository;
    private final QuestCompletionRepository completionRepository;
    private final QuestRepository questRepository;
    private final SkillService skillService;
    private final QuestService questService;
    private final AchievementService achievementService;
    private final LevelService levelService;
    private final SystemQuoteService systemQuoteService;

    @PersistenceContext
    private EntityManager em;

    public PlayerService(PlayerRepository playerRepository,
                         PlayerStatsRepository statsRepository,
                         QuestCompletionRepository completionRepository,
                         QuestRepository questRepository,
                         SkillService skillService,
                         QuestService questService,
                         AchievementService achievementService,
                         LevelService levelService,
                         SystemQuoteService systemQuoteService) {
        this.playerRepository = playerRepository;
        this.statsRepository = statsRepository;
        this.completionRepository = completionRepository;
        this.questRepository = questRepository;
        this.skillService = skillService;
        this.questService = questService;
        this.achievementService = achievementService;
        this.levelService = levelService;
        this.systemQuoteService = systemQuoteService;
    }

    public Player getByUsername(String username) {
        return playerRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ApiException("Player not found", HttpStatus.NOT_FOUND));
    }

    public PlayerDTO toDto(Player p) {
        return new PlayerDTO(p.getId(), p.getUsername(), p.getDisplayName(), p.getEmail(),
                p.getRankLevel(), p.getLevel(), p.getCurrentXp(), p.getTotalXp(),
                levelService.xpToNextLevel(), p.getHp(), p.getMaxHp(), p.getEquippedTitle());
    }

    public PlayerDTO getProfile(Long playerId) {
        return toDto(find(playerId));
    }

    public PlayerDTO updateProfile(Long playerId, UpdateProfileRequest req) {
        Player p = find(playerId);
        if (req.displayName() != null && !req.displayName().isBlank()) {
            p.setDisplayName(req.displayName());
        }
        if (req.username() != null && !req.username().isBlank()
                && !req.username().equals(p.getUsername())) {
            if (playerRepository.existsByUsername(req.username())) {
                throw new ApiException("Username already taken", HttpStatus.CONFLICT);
            }
            p.setUsername(req.username());
        }
        return toDto(playerRepository.save(p));
    }

    /**
     * Permanently deletes the player and every record they own. All player-scoped
     * entities reference the player through a plain {@code playerId} column, so a
     * set of JPQL bulk deletes fully wipes the account. Shared catalogs (e.g. the
     * global {@code quests} table) are intentionally left untouched.
     */
    @Transactional
    public void deleteAccount(Long playerId) {
        find(playerId); // 404 if the account no longer exists

        // Detail rows that hang off a job application must go before the applications.
        em.createQuery("DELETE FROM InterviewRound ir WHERE ir.applicationId IN " +
                        "(SELECT j.id FROM JobApplication j WHERE j.playerId = :id)")
                .setParameter("id", playerId).executeUpdate();

        // All remaining player-scoped entities (completions/logs first, then parents).
        String[] entities = {
                "HabitCompletion", "Habit",
                "QuestCompletion",
                "BossBattle", "Dungeon",
                "PlayerStats", "PlayerSkill", "Achievement", "Notification",
                "JobApplication", "LeetcodeLog", "CourseProgress",
                "HealthLog", "MindLog", "BodyLog", "EnglishLog", "ExerciseLog",
                "VocabularyLog", "RelationshipLog", "SavingsGoal", "BudgetEntry",
                "SelfDoubtEvidence"
        };
        for (String entity : entities) {
            em.createQuery("DELETE FROM " + entity + " e WHERE e.playerId = :id")
                    .setParameter("id", playerId).executeUpdate();
        }

        em.createQuery("DELETE FROM Player p WHERE p.id = :id")
                .setParameter("id", playerId).executeUpdate();
    }

    public StatusWindowDTO getStatusWindow(Long playerId) {
        Player player = find(playerId);
        PlayerStats stats = statsRepository.findByPlayerId(playerId)
                .orElseThrow(() -> new ApiException("Stats not found", HttpStatus.NOT_FOUND));

        StatsDTO statsDto = new StatsDTO(stats.getStrength(), stats.getIntelligence(),
                stats.getVitality(), stats.getAgility(), stats.getPerception(), stats.getHor());

        List<PlayerSkillDTO> skills = skillService.getPlayerSkills(playerId);
        List<QuestDTO> todayQuests = questService.getTodayQuests(playerId);
        int completedToday = (int) todayQuests.stream().filter(QuestDTO::isCompleted).count();
        int totalQuests = todayQuests.size();

        List<DayProgressDTO> weekly = getWeeklyProgress(playerId);
        List<AchievementDTO> achievements = achievementService.getPlayerAchievements(playerId);
        int streak = calculateStreak(playerId);
        String motivation = motivation(completedToday, totalQuests, statsDto);
        String systemQuote = systemQuoteService.quoteForToday();

        return new StatusWindowDTO(toDto(player), statsDto, skills, todayQuests, weekly,
                achievements, completedToday, totalQuests, streak, motivation, systemQuote);
    }

    public List<DayProgressDTO> getWeeklyProgress(Long playerId) {
        LocalDate today = LocalDate.now();
        LocalDate start = today.minusDays(6);
        List<QuestCompletion> completions =
                completionRepository.findByPlayerIdAndCompletedAtBetween(playerId, start, today);

        Map<LocalDate, List<QuestCompletion>> byDate = completions.stream()
                .collect(Collectors.groupingBy(QuestCompletion::getCompletedAt));

        List<DayProgressDTO> result = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate date = start.plusDays(i);
            List<QuestCompletion> dayCompletions = byDate.getOrDefault(date, List.of());
            int count = dayCompletions.size();
            int xp = dayCompletions.stream().mapToInt(QuestCompletion::getXpGained).sum();
            String label = date.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            result.add(new DayProgressDTO(date.toString(), label, count, xp, date.equals(today)));
        }
        return result;
    }

    /**
     * Streak = consecutive days (ending today or yesterday) with at least 5 quests completed.
     */
    public int calculateStreak(Long playerId) {        List<QuestCompletion> all =
                completionRepository.findByPlayerIdOrderByCompletedAtDesc(playerId);
        Map<LocalDate, Long> countByDate = all.stream()
                .collect(Collectors.groupingBy(QuestCompletion::getCompletedAt, Collectors.counting()));

        int streak = 0;
        LocalDate cursor = LocalDate.now();
        // allow streak to count from today; if today not yet done, start from yesterday
        if (countByDate.getOrDefault(cursor, 0L) < 5) {
            cursor = cursor.minusDays(1);
        }
        while (countByDate.getOrDefault(cursor, 0L) >= 5) {
            streak++;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }

    /** Longest ever run of consecutive days with >= 5 quests completed. */
    public int longestStreak(Long playerId) {
        Set<LocalDate> strongDays = completionRepository
                .findByPlayerIdOrderByCompletedAtDesc(playerId).stream()
                .collect(Collectors.groupingBy(QuestCompletion::getCompletedAt, Collectors.counting()))
                .entrySet().stream()
                .filter(e -> e.getValue() >= 5)
                .map(Map.Entry::getKey)
                .collect(Collectors.toSet());

        int best = 0;
        for (LocalDate day : strongDays) {
            // count only when this day is the start of a run (previous day not strong)
            if (!strongDays.contains(day.minusDays(1))) {
                int run = 0;
                LocalDate cursor = day;
                while (strongDays.contains(cursor)) {
                    run++;
                    cursor = cursor.plusDays(1);
                }
                best = Math.max(best, run);
            }
        }
        return best;
    }

    /** GitHub-style consistency heatmap for the last {@code days} days (capped 1..366). */
    public List<HeatmapDayDTO> getHeatmap(Long playerId, int days) {
        int span = Math.max(1, Math.min(days, 366));
        LocalDate today = LocalDate.now();
        LocalDate start = today.minusDays(span - 1L);

        List<QuestCompletion> completions =
                completionRepository.findByPlayerIdAndCompletedAtBetween(playerId, start, today);
        Map<LocalDate, List<QuestCompletion>> byDate = completions.stream()
                .collect(Collectors.groupingBy(QuestCompletion::getCompletedAt));

        List<HeatmapDayDTO> result = new ArrayList<>();
        for (int i = 0; i < span; i++) {
            LocalDate date = start.plusDays(i);
            List<QuestCompletion> day = byDate.getOrDefault(date, List.of());
            int count = day.size();
            int xp = day.stream().mapToInt(QuestCompletion::getXpGained).sum();
            result.add(new HeatmapDayDTO(date.toString(), count, xp, intensity(count)));
        }
        return result;
    }

    private int intensity(int count) {
        if (count <= 0) return 0;
        if (count <= 3) return 1;
        if (count <= 6) return 2;
        if (count <= 9) return 3;
        return 4;
    }

    /** The System's monthly report card, measured against the D → C → B targets. */
    public MonthlyReportDTO getMonthlyReport(Long playerId) {
        Player player = find(playerId);
        PlayerStats stats = statsRepository.findByPlayerId(playerId)
                .orElseThrow(() -> new ApiException("Stats not found", HttpStatus.NOT_FOUND));
        StatsDTO statsDto = new StatsDTO(stats.getStrength(), stats.getIntelligence(),
                stats.getVitality(), stats.getAgility(), stats.getPerception(), stats.getHor());

        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);
        List<QuestCompletion> monthCompletions =
                completionRepository.findByPlayerIdAndCompletedAtBetween(playerId, monthStart, today);

        Map<LocalDate, Long> countByDate = monthCompletions.stream()
                .collect(Collectors.groupingBy(QuestCompletion::getCompletedAt, Collectors.counting()));

        int daysActive = countByDate.size();
        int daysElapsed = today.getDayOfMonth();
        int totalQuests = monthCompletions.size();
        int totalXp = monthCompletions.stream().mapToInt(QuestCompletion::getXpGained).sum();
        int perfectDays = (int) countByDate.values().stream().filter(c -> c >= 10).count();
        int currentStreak = calculateStreak(playerId);
        int longest = longestStreak(playerId);
        double avg = daysActive == 0 ? 0 : (double) totalQuests / daysActive;

        String best = strongestStat(statsDto);
        String weakest = weakestStat(statsDto);
        String monthLabel = today.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH)
                + " " + today.getYear();

        String rankTarget = rankTargetNarrative(player.getRankLevel());
        String verdict = verdict(perfectDays, daysActive, daysElapsed, currentStreak);

        return new MonthlyReportDTO(monthLabel, daysActive, daysElapsed, totalQuests, totalXp,
                perfectDays, currentStreak, longest, Math.round(avg * 10) / 10.0,
                best, weakest, player.getRankLevel(), player.getLevel(), player.getTotalXp(),
                rankTarget, verdict);
    }

    private String strongestStat(StatsDTO s) {
        Map<String, Integer> map = new LinkedHashMap<>();
        map.put("Strength", s.str());
        map.put("Intelligence", s.intelligence());
        map.put("Vitality", s.vit());
        map.put("Agility", s.agi());
        map.put("Perception", s.per());
        map.put("Hormonal Health", s.hor());
        return map.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("Vitality");
    }

    private String rankTargetNarrative(String rank) {
        return switch (rank) {
            case "E" -> "Target: reach D-Rank. Clear quests daily — the climb begins at the bottom.";
            case "D" -> "Month 1 target cleared. Next gate: C-Rank — interview-ready territory.";
            case "C" -> "Interview-ready. Push for B-Rank — consistency separates hunters from the weak.";
            case "B" -> "Elite tier. Hold the line and grind toward A-Rank.";
            case "A" -> "Near the summit. S-Rank is within reach, Hunter.";
            default -> "S-Rank. You have become the apex. Keep forwarding.";
        };
    }

    private String verdict(int perfectDays, int daysActive, int daysElapsed, int streak) {
        double activeRatio = daysElapsed == 0 ? 0 : (double) daysActive / daysElapsed;
        if (perfectDays >= 20) {
            return "MONARCH-TIER MONTH. The System has never seen such discipline. Unstoppable.";
        } else if (activeRatio >= 0.8 && streak >= 5) {
            return "STRONG MONTH. Your consistency is forging real power. Do not slow down.";
        } else if (activeRatio >= 0.5) {
            return "PROGRESS DETECTED. The foundation is set — now raise the intensity.";
        } else if (daysActive > 0) {
            return "THE SYSTEM IS WATCHING. Too many silent days. Reclaim your momentum.";
        }
        return "DORMANT. No quests cleared this month. Rise, Hunter — the gate is still open.";
    }

    private String motivation(int done, int total, StatsDTO stats) {
        double pct = total == 0 ? 0 : (double) done / total;
        String weakest = weakestStat(stats);
        if (done == 0) {
            return "The System has awakened. Rise, Hunter. Your first quest awaits.";
        } else if (pct >= 1.0) {
            return "PERFECT CLEARANCE. You have conquered today's gate. The System acknowledges your strength.";
        } else if (pct >= 0.6) {
            return "You grow stronger. Push through the remaining quests — do not falter now.";
        } else if (pct >= 0.3) {
            return "Progress detected. Your " + weakest + " remains weak. Close the gap, Hunter.";
        } else {
            return "The path is long. Focus your effort on " + weakest + ". The System is watching.";
        }
    }

    private String weakestStat(StatsDTO s) {
        Map<String, Integer> map = new LinkedHashMap<>();
        map.put("Strength", s.str());
        map.put("Intelligence", s.intelligence());
        map.put("Vitality", s.vit());
        map.put("Agility", s.agi());
        map.put("Perception", s.per());
        map.put("Hormonal Health", s.hor());
        return map.entrySet().stream()
                .min(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("Vitality");
    }

    private Player find(Long playerId) {
        return playerRepository.findById(playerId)
                .orElseThrow(() -> new ApiException("Player not found", HttpStatus.NOT_FOUND));
    }
}

