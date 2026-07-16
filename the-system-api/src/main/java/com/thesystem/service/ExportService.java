package com.thesystem.service;

import com.thesystem.entity.Player;
import com.thesystem.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Phase 4 — Data Export. Aggregates every piece of a player's own data into a
 * single JSON object for personal backup. All queries are player-scoped, and the
 * player object is sanitised (no password hash / internal fields leak).
 */
@Service
public class ExportService {

    private final PlayerStatsRepository statsRepo;
    private final PlayerSkillRepository skillRepo;
    private final AchievementRepository achievementRepo;
    private final HabitRepository habitRepo;
    private final QuestCompletionRepository completionRepo;
    private final HealthLogRepository healthRepo;
    private final MindLogRepository mindRepo;
    private final BodyLogRepository bodyRepo;
    private final BodyMetricRepository bodyMetricRepo;
    private final ExerciseLogRepository exerciseRepo;
    private final WorkoutEntryRepository workoutRepo;
    private final LeetcodeLogRepository leetcodeRepo;
    private final JobApplicationRepository jobRepo;
    private final BudgetEntryRepository budgetRepo;
    private final SavingsGoalRepository savingsRepo;
    private final DeepWorkSessionRepository deepWorkRepo;
    private final SelfDoubtEvidenceRepository evidenceRepo;

    public ExportService(PlayerStatsRepository statsRepo, PlayerSkillRepository skillRepo,
                         AchievementRepository achievementRepo, HabitRepository habitRepo,
                         QuestCompletionRepository completionRepo, HealthLogRepository healthRepo,
                         MindLogRepository mindRepo, BodyLogRepository bodyRepo,
                         BodyMetricRepository bodyMetricRepo, ExerciseLogRepository exerciseRepo,
                         WorkoutEntryRepository workoutRepo, LeetcodeLogRepository leetcodeRepo,
                         JobApplicationRepository jobRepo, BudgetEntryRepository budgetRepo,
                         SavingsGoalRepository savingsRepo, DeepWorkSessionRepository deepWorkRepo,
                         SelfDoubtEvidenceRepository evidenceRepo) {
        this.statsRepo = statsRepo;
        this.skillRepo = skillRepo;
        this.achievementRepo = achievementRepo;
        this.habitRepo = habitRepo;
        this.completionRepo = completionRepo;
        this.healthRepo = healthRepo;
        this.mindRepo = mindRepo;
        this.bodyRepo = bodyRepo;
        this.bodyMetricRepo = bodyMetricRepo;
        this.exerciseRepo = exerciseRepo;
        this.workoutRepo = workoutRepo;
        this.leetcodeRepo = leetcodeRepo;
        this.jobRepo = jobRepo;
        this.budgetRepo = budgetRepo;
        this.savingsRepo = savingsRepo;
        this.deepWorkRepo = deepWorkRepo;
        this.evidenceRepo = evidenceRepo;
    }

    public Map<String, Object> exportAll(Player player) {
        Long pid = player.getId();
        Map<String, Object> out = new LinkedHashMap<>();

        out.put("exportedAt", LocalDateTime.now().toString());
        out.put("schema", "the-system/v1");
        out.put("player", sanitisedPlayer(player));

        out.put("stats", statsRepo.findByPlayerId(pid).orElse(null));
        out.put("skills", skillRepo.findByPlayerId(pid));
        out.put("achievements", achievementRepo.findByPlayerIdOrderByUnlockedAtDesc(pid));
        out.put("habits", habitRepo.findByPlayerIdOrderByCreatedAtAsc(pid));
        out.put("questCompletions", completionRepo.findByPlayerIdOrderByCompletedAtDesc(pid));
        out.put("healthLogs", healthRepo.findByPlayerIdOrderByLogDateDesc(pid));
        out.put("mindLogs", mindRepo.findByPlayerIdOrderByLogDateDesc(pid));
        out.put("bodyLogs", bodyRepo.findByPlayerIdOrderByLogDateDesc(pid));
        out.put("bodyMetrics", bodyMetricRepo.findByPlayerIdOrderByLogDateDesc(pid));
        out.put("exerciseLogs", exerciseRepo.findByPlayerIdOrderByExerciseDateDesc(pid));
        out.put("workouts", workoutRepo.findByPlayerIdOrderByWorkoutDateDescIdDesc(pid));
        out.put("leetcode", leetcodeRepo.findByPlayerIdOrderBySolvedDateDesc(pid));
        out.put("jobApplications", jobRepo.findByPlayerIdOrderByAppliedDateDesc(pid));
        out.put("budgets", budgetRepo.findByPlayerIdOrderByEntryMonthDesc(pid));
        out.put("savingsGoals", savingsRepo.findByPlayerIdOrderByDeadlineAsc(pid));
        out.put("deepWorkSessions", deepWorkRepo.findByPlayerIdOrderBySessionDateDesc(pid));
        out.put("selfDoubtEvidence", evidenceRepo.findByPlayerIdOrderByEntryDateDesc(pid));

        return out;
    }

    /** Only safe, non-sensitive player fields (never the password hash). */
    private Map<String, Object> sanitisedPlayer(Player p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.getId());
        m.put("username", p.getUsername());
        m.put("displayName", p.getDisplayName());
        m.put("email", p.getEmail());
        m.put("rankLevel", p.getRankLevel());
        m.put("level", p.getLevel());
        m.put("currentXp", p.getCurrentXp());
        m.put("totalXp", p.getTotalXp());
        m.put("hp", p.getHp());
        m.put("maxHp", p.getMaxHp());
        m.put("equippedTitle", p.getEquippedTitle());
        m.put("createdAt", p.getCreatedAt() != null ? p.getCreatedAt().toString() : null);
        return m;
    }
}

