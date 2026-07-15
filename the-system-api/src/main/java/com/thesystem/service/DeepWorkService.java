package com.thesystem.service;

import com.thesystem.entity.DeepWorkSession;
import com.thesystem.entity.Player;
import com.thesystem.exception.ApiException;
import com.thesystem.repository.DeepWorkSessionRepository;
import com.thesystem.repository.PlayerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Deep Work Tracker — a core stat for software engineers.
 *
 * Tracks actual coding sessions with interruptions and mobile distractions.
 * Awards "Focus XP" which is additive with quest XP.
 *
 * Focus XP formula:
 *   Base:    codingMinutes / 5
 *   Bonus:   focusSessions × 10 (Pomodoro blocks)
 *   Penalty: interruptions × 5 + mobilePickups × 3
 *   Min:     0
 *
 * Focus Score (0–100): 100 − (interruptions × 5) − (mobilePickups × 3)
 *
 * Aggregate: Total coding hours across all sessions feeds the
 * Interview Readiness computation as practical coding evidence.
 */
@Service
public class DeepWorkService {

    private final DeepWorkSessionRepository sessionRepository;
    private final PlayerRepository playerRepository;
    private final LevelService levelService;

    public DeepWorkService(DeepWorkSessionRepository sessionRepository,
                           PlayerRepository playerRepository,
                           LevelService levelService) {
        this.sessionRepository = sessionRepository;
        this.playerRepository = playerRepository;
        this.levelService = levelService;
    }

    /** Log a deep work session and award Focus XP to the player. */
    @Transactional
    public DeepWorkSession logSession(Long playerId, DeepWorkSession input) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new ApiException("Player not found", HttpStatus.NOT_FOUND));

        input.setId(null);
        input.setPlayerId(playerId);
        input.setSessionDate(LocalDate.now());

        // Compute Focus XP
        int focusXp = computeFocusXp(input);
        input.setFocusXpEarned(focusXp);
        input.setFocusScore(computeFocusScore(input));

        // Award Focus XP to player
        player.setCurrentXp(player.getCurrentXp() + focusXp);
        player.setTotalXp(player.getTotalXp() + focusXp);
        levelService.checkLevelUp(player);
        playerRepository.save(player);

        return sessionRepository.save(input);
    }

    public List<DeepWorkSession> getWeeklySessions(Long playerId) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(6);
        return sessionRepository.findByPlayerIdAndSessionDateBetweenOrderBySessionDateDesc(
                playerId, start, end);
    }

    public List<DeepWorkSession> getHistory(Long playerId) {
        return sessionRepository.findByPlayerIdOrderBySessionDateDesc(playerId);
    }

    public Map<String, Object> getStats(Long playerId) {
        int totalMinutes = sessionRepository.sumCodingMinutesByPlayerId(playerId);
        int totalFocusXp = sessionRepository.sumFocusXpByPlayerId(playerId);
        List<DeepWorkSession> recent = getWeeklySessions(playerId);
        int weeklyMinutes = recent.stream().mapToInt(DeepWorkSession::getCodingMinutes).sum();
        double avgFocusScore = recent.stream()
                .mapToInt(DeepWorkSession::getFocusScore).average().orElse(0.0);

        return Map.of(
                "totalCodingHours", totalMinutes / 60.0,
                "totalFocusXp", totalFocusXp,
                "weeklyMinutes", weeklyMinutes,
                "weeklyHours", weeklyMinutes / 60.0,
                "avgFocusScore", Math.round(avgFocusScore),
                "sessionCount", recent.size()
        );
    }

    // ── Computation helpers ────────────────────────────────────────────────────

    /**
     * Focus XP = (codingMinutes / 5) + (focusSessions × 10)
     *          − (interruptions × 5) − (mobilePickups × 3)
     */
    public int computeFocusXp(DeepWorkSession s) {
        int base = s.getCodingMinutes() / 5;
        int bonus = s.getFocusSessions() * 10;
        int penalty = (s.getInterruptions() * 5) + (s.getMobilePickups() * 3);
        return Math.max(0, base + bonus - penalty);
    }

    /**
     * Focus Score (0–100): 100 − interruption penalties − pickup penalties.
     */
    public int computeFocusScore(DeepWorkSession s) {
        int penalty = (s.getInterruptions() * 5) + (s.getMobilePickups() * 3);
        return Math.max(0, Math.min(100, 100 - penalty));
    }
}
