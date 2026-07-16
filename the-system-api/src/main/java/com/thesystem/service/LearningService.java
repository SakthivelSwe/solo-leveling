package com.thesystem.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.thesystem.dto.LearningStatsDTO;
import com.thesystem.entity.LearningLog;
import com.thesystem.entity.Player;
import com.thesystem.entity.PlayerSkill;
import com.thesystem.exception.ApiException;
import com.thesystem.repository.LearningLogRepository;
import com.thesystem.repository.PlayerRepository;
import com.thesystem.repository.PlayerSkillRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Core service for the Learning Activity Tracker.
 *
 * Responsibilities:
 * - Log a learning session (YouTube / website / DevMastery / book)
 * - Compute XP using the learning XP formula
 * - SM-2 spaced repetition scheduling (review intervals based on confidence)
 * - Mark recall done (update SM-2 state, award recall bonus XP)
 * - Update PlayerSkill XP when learning targets a known skill
 * - Return learning stats for the dashboard
 */
@Service
public class LearningService {

    // ── XP constants ──────────────────────────────────────────────────────────
    private static final int XP_PER_5_MINUTES = 1;    // base: durationMinutes / 5
    private static final int XP_NOTES_BONUS    = 10;
    private static final int XP_CODED_BONUS    = 15;
    private static final int XP_RECALL_BONUS   = 20;  // recall done in same session
    private static final int XP_RECALL_LATE_PENALTY = 10; // recall overdue > 2 days
    private static final int XP_MIN            = 5;
    private static final int XP_MAX            = 100;

    // Recall bonus XP (when markRecallDone is called separately)
    private static final int RECALL_XP_PERFECT = 30;  // confidence 5
    private static final int RECALL_XP_GOOD    = 20;  // confidence 4
    private static final int RECALL_XP_OK      = 10;  // confidence 3
    private static final int RECALL_XP_POOR    = 5;   // confidence 1-2

    // ── Skill XP per learning session ─────────────────────────────────────────
    private static final int SKILL_XP_PER_SESSION       = 5;
    private static final int SKILL_XP_CODED_ALONG_BONUS = 5;
    private static final int SKILL_XP_RECALL_BONUS      = 10;
    private static final int SKILL_XP_DEVMASTERY        = 15; // DevMastery topic complete

    // ── Subject → PlayerSkill name mapping ────────────────────────────────────
    private static final Map<String, String> SUBJECT_TO_SKILL = Map.of(
        "Java",           "Java + Spring Boot",
        "Spring Boot",    "Java + Spring Boot",
        "DSA",            "DSA / LeetCode",
        "System Design",  "System Design",
        "Angular",        "Angular / JavaScript",
        "JavaScript",     "Angular / JavaScript",
        "English",        "English Speaking"
    );

    // ── SM-2 review intervals (days) by confidence score ─────────────────────
    // confidence 1-2 → 1 day, 3 → 3 days, 4 → 7 days, 5 → 14 days
    private static final int[] SM2_INTERVALS = {0, 1, 1, 3, 7, 14};

    private final LearningLogRepository logRepo;
    private final PlayerRepository playerRepo;
    private final PlayerSkillRepository skillRepo;
    private final LevelService levelService;
    private final SseService sseService;
    private final ObjectMapper mapper = new ObjectMapper();

    public LearningService(LearningLogRepository logRepo,
                           PlayerRepository playerRepo,
                           PlayerSkillRepository skillRepo,
                           LevelService levelService,
                           SseService sseService) {
        this.logRepo = logRepo;
        this.playerRepo = playerRepo;
        this.skillRepo = skillRepo;
        this.levelService = levelService;
        this.sseService = sseService;
    }

    // ── Log a learning session ────────────────────────────────────────────────

    @Transactional
    public LearningLog logSession(Long playerId, LearningLog body) {
        body.setId(null);
        body.setPlayerId(playerId);
        if (body.getLogDate() == null) body.setLogDate(LocalDate.now());

        // Compute XP
        int xp = computeXp(body);
        body.setXpEarned(xp);

        // Set initial SM-2 review date (always next day if recall not done today)
        if (!body.isRecallDone()) {
            body.setReviewDueDate(body.getLogDate().plusDays(1));
        } else {
            // Recall done in same session — use confidence to set next review
            int confidence = Math.max(1, Math.min(5, body.getConfidenceScore()));
            body.setReviewDueDate(body.getLogDate().plusDays(SM2_INTERVALS[confidence]));
            body.setReviewCount(1);
        }

        LearningLog saved = logRepo.save(body);

        // Award XP to player
        awardXpToPlayer(playerId, xp);

        // Update PlayerSkill XP
        updateSkillXp(playerId, body.getSubject(),
                SKILL_XP_PER_SESSION + (body.isCodedAlong() ? SKILL_XP_CODED_ALONG_BONUS : 0)
                + (body.isRecallDone() ? SKILL_XP_RECALL_BONUS : 0));

        // Push SSE event
        sseService.send(playerId, "learning-update",
                Map.of("xpEarned", xp, "topic", body.getTopic(), "subject", body.getSubject()));

        return saved;
    }

    // ── Mark recall done (separate from logging) ──────────────────────────────

    @Transactional
    public LearningLog markRecallDone(Long playerId, Long logId,
                                      int confidenceScore, List<Boolean> keyPointResults) {
        LearningLog log = logRepo.findById(logId)
                .orElseThrow(() -> new ApiException("Learning log not found", HttpStatus.NOT_FOUND));
        if (!log.getPlayerId().equals(playerId)) {
            throw new ApiException("Not your learning log", HttpStatus.FORBIDDEN);
        }
        if (log.isRecallDone() && log.getReviewCount() >= 1) {
            // Allow re-recall — just update confidence and SM-2
        }

        int confidence = Math.max(1, Math.min(5, confidenceScore));
        log.setRecallDone(true);
        log.setConfidenceScore(confidence);
        log.setReviewCount(log.getReviewCount() + 1);

        // Save key point check results as JSON
        if (keyPointResults != null && !keyPointResults.isEmpty()) {
            try {
                log.setRecallKeyPointResults(mapper.writeValueAsString(keyPointResults));
            } catch (Exception ignored) {}
        }

        // SM-2: compute next review date
        // For subsequent reviews (reviewCount > 1), extend interval further
        int baseInterval = SM2_INTERVALS[confidence];
        int extended = log.getReviewCount() > 2 ? baseInterval * log.getReviewCount() : baseInterval;
        log.setReviewDueDate(LocalDate.now().plusDays(Math.min(extended, 90)));

        // Recall bonus XP
        int recallXp = switch (confidence) {
            case 5 -> RECALL_XP_PERFECT;
            case 4 -> RECALL_XP_GOOD;
            case 3 -> RECALL_XP_OK;
            default -> RECALL_XP_POOR;
        };
        log.setXpEarned(log.getXpEarned() + recallXp);

        logRepo.save(log);
        awardXpToPlayer(playerId, recallXp);
        updateSkillXp(playerId, log.getSubject(), SKILL_XP_RECALL_BONUS);

        sseService.send(playerId, "recall-done",
                Map.of("xpEarned", recallXp, "confidence", confidence,
                        "nextReview", log.getReviewDueDate().toString()));
        return log;
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    public List<LearningLog> getHistory(Long playerId) {
        return logRepo.findTop30ByPlayerIdOrderByLogDateDescCreatedAtDesc(playerId);
    }

    public List<LearningLog> getDueRecalls(Long playerId) {
        return logRepo.findByPlayerIdAndRecallDoneFalseAndReviewDueDateLessThanEqual(
                playerId, LocalDate.now());
    }

    public LearningStatsDTO getStats(Long playerId) {
        LocalDate today = LocalDate.now();
        LocalDate weekAgo = today.minusDays(6);

        long total = logRepo.countTotal(playerId);
        int totalMins = logRepo.sumMinutesByPlayerIdAndDateRange(playerId,
                today.minusMonths(3), today);
        long totalXp = logRepo.sumXpByPlayerId(playerId);

        long recallsDone = logRepo.countRecallsDone(playerId);
        double recallRate = total > 0 ? (recallsDone * 100.0 / total) : 0.0;

        int dueCount = logRepo.findByPlayerIdAndRecallDoneFalseAndReviewDueDateLessThanEqual(
                playerId, today).size();

        // Subject stats (last 3 months)
        List<Object[]> rawSubjects = logRepo.subjectStats(playerId, today.minusMonths(3));
        List<LearningStatsDTO.SubjectStat> subjects = rawSubjects.stream()
                .map(r -> new LearningStatsDTO.SubjectStat(
                        (String) r[0], ((Number) r[1]).longValue(), ((Number) r[2]).intValue()))
                .toList();

        // Daily minutes (last 7 days)
        List<Object[]> rawDaily = logRepo.dailyMinutes(playerId, weekAgo);
        List<LearningStatsDTO.DailyMinutes> daily = buildWeeklyActivity(rawDaily, weekAgo, today);

        int streak = computeLearnStreak(playerId, today);

        return new LearningStatsDTO(total, totalMins, totalMins / 60,
                totalXp, recallRate, streak, dueCount, subjects, daily);
    }

    // ── DevMastery webhook helper ─────────────────────────────────────────────

    /**
     * Creates a LearningLog from a DevMastery topic completion event.
     * Called by DevMasteryWebhookController.
     */
    @Transactional
    public LearningLog logDevMasteryTopic(Long playerId, String topicId,
                                           String topicTitle, String pathSlug, int xp) {
        // Deduplication — skip if already synced
        if (logRepo.existsByPlayerIdAndDevMasteryTopicId(playerId, topicId)) {
            throw new ApiException("Topic already synced: " + topicId, HttpStatus.CONFLICT);
        }

        LearningLog log = new LearningLog();
        log.setPlayerId(playerId);
        log.setLogDate(LocalDate.now());
        log.setSubject(inferSubjectFromPath(pathSlug));
        log.setTopic(topicTitle);
        log.setSource("DEVMASTERY");
        log.setPlatformName("DevMastery");
        log.setActivityType("READ_ARTICLE");
        log.setDurationMinutes(20); // estimated
        log.setDevMasteryTopicId(topicId);
        log.setReviewDueDate(LocalDate.now().plusDays(1));
        log.setXpEarned(xp);

        logRepo.save(log);
        awardXpToPlayer(playerId, xp);
        updateSkillXp(playerId, log.getSubject(), SKILL_XP_DEVMASTERY);

        sseService.send(playerId, "devmastery-sync",
                Map.of("xpEarned", xp, "topic", topicTitle, "source", "DEVMASTERY"));
        return log;
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    private int computeXp(LearningLog log) {
        int base = Math.max(1, log.getDurationMinutes() / 5);
        int bonus = 0;
        if (log.isNoteTaken())   bonus += XP_NOTES_BONUS;
        if (log.isCodedAlong())  bonus += XP_CODED_BONUS;
        if (log.isRecallDone())  bonus += XP_RECALL_BONUS;

        // Penalty if recall was already overdue (log date was > 2 days ago)
        boolean overdue = log.getLogDate() != null &&
                LocalDate.now().isAfter(log.getLogDate().plusDays(2)) && !log.isRecallDone();
        if (overdue) bonus -= XP_RECALL_LATE_PENALTY;

        double multiplier = 1.0;
        if (log.getConfidenceScore() >= 4) multiplier = 1.2;
        else if (log.getConfidenceScore() >= 1 && log.getConfidenceScore() <= 2) multiplier = 0.8;

        int total = (int) Math.round((base + bonus) * multiplier);
        return Math.max(XP_MIN, Math.min(XP_MAX, total));
    }

    @Transactional
    private void awardXpToPlayer(Long playerId, int xp) {
        if (xp <= 0) return;
        Player player = playerRepo.findById(playerId).orElse(null);
        if (player == null) return;
        player.setCurrentXp(player.getCurrentXp() + xp);
        player.setTotalXp(player.getTotalXp() + xp);
        levelService.checkLevelUp(player);
        playerRepo.save(player);
    }

    @Transactional
    private void updateSkillXp(Long playerId, String subject, int skillXpDelta) {
        if (skillXpDelta <= 0 || subject == null) return;
        String skillName = SUBJECT_TO_SKILL.get(subject);
        if (skillName == null) return;

        PlayerSkill skill = skillRepo.findByPlayerIdAndSkillName(playerId, skillName)
                .orElseGet(() -> {
                    PlayerSkill s = new PlayerSkill(playerId, skillName, 0);
                    return s;
                });

        skill.setSkillXp(skill.getSkillXp() + skillXpDelta);
        skill.recalculateLevelAndRank();
        skill.setUpdatedAt(java.time.LocalDateTime.now());
        skillRepo.save(skill);
    }

    private String inferSubjectFromPath(String pathSlug) {
        if (pathSlug == null) return "Other";
        String p = pathSlug.toLowerCase();
        if (p.contains("java") || p.contains("spring")) return "Java";
        if (p.contains("dsa") || p.contains("algorithm") || p.contains("leetcode")) return "DSA";
        if (p.contains("angular") || p.contains("javascript") || p.contains("frontend")) return "Angular";
        if (p.contains("system") || p.contains("design")) return "System Design";
        return "Other";
    }

    private int computeLearnStreak(Long playerId, LocalDate today) {
        int streak = 0;
        LocalDate cursor = today;
        // Walk back day by day checking if there was a session
        for (int i = 0; i < 365; i++) {
            List<LearningLog> daySessions = logRepo.findByPlayerIdAndLogDate(playerId, cursor);
            if (daySessions.isEmpty()) {
                if (cursor.equals(today)) {
                    cursor = cursor.minusDays(1); // allow today to be missing (check yesterday first)
                    continue;
                }
                break;
            }
            streak++;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }

    private List<LearningStatsDTO.DailyMinutes> buildWeeklyActivity(
            List<Object[]> rawDaily, LocalDate from, LocalDate to) {
        // Build a map of date → minutes
        var minutesByDate = new java.util.HashMap<LocalDate, Integer>();
        for (Object[] row : rawDaily) {
            minutesByDate.put((LocalDate) row[0], ((Number) row[1]).intValue());
        }
        // Fill all 7 days (including zeros)
        List<LearningStatsDTO.DailyMinutes> result = new ArrayList<>();
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            result.add(new LearningStatsDTO.DailyMinutes(d, minutesByDate.getOrDefault(d, 0)));
        }
        return result;
    }
}
