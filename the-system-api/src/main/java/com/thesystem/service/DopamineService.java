package com.thesystem.service;

import com.thesystem.entity.DopamineLog;
import com.thesystem.entity.Player;
import com.thesystem.exception.ApiException;
import com.thesystem.repository.DopamineLogRepository;
import com.thesystem.repository.PlayerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Dopamine Level Tracker.
 *
 * Tracks dopamine-draining behaviors and computes a Focus Multiplier
 * that reduces or enhances XP earned during the day.
 *
 * This is one of THE SYSTEM's most psychologically grounded features:
 * high dopamine from passive scrolling directly impairs the brain's
 * ability to focus on deep work (coding, LeetCode, English).
 */
@Service
public class DopamineService {

    private final DopamineLogRepository logRepository;
    private final PlayerRepository playerRepository;

    public DopamineService(DopamineLogRepository logRepository,
                           PlayerRepository playerRepository) {
        this.logRepository = logRepository;
        this.playerRepository = playerRepository;
    }

    /** Log or update today's dopamine data. Recomputes score and focus multiplier. */
    @Transactional
    public DopamineLog logToday(Long playerId, DopamineLog input) {
        DopamineLog log = logRepository.findByPlayerIdAndLogDate(playerId, LocalDate.now())
                .orElseGet(() -> {
                    DopamineLog n = new DopamineLog();
                    n.setPlayerId(playerId);
                    n.setLogDate(LocalDate.now());
                    return n;
                });

        log.setSocialMediaMin(input.getSocialMediaMin());
        log.setReelsMin(input.getReelsMin());
        log.setGamingMin(input.getGamingMin());
        log.setJunkFoodItems(input.getJunkFoodItems());
        log.setPornViewed(input.isPornViewed());
        log.setExerciseDone(input.isExerciseDone());
        log.setColdShower(input.isColdShower());

        int score = computeScore(log);
        log.setDopamineScore(score);
        log.setFocusPct(computeFocusPct(score));

        return logRepository.save(log);
    }

    public DopamineLog getToday(Long playerId) {
        return logRepository.findByPlayerIdAndLogDate(playerId, LocalDate.now())
                .orElseGet(() -> {
                    DopamineLog clean = new DopamineLog();
                    clean.setPlayerId(playerId);
                    clean.setDopamineScore(0);
                    clean.setFocusPct(100);
                    return clean;
                });
    }

    public List<DopamineLog> getHistory(Long playerId, int days) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(Math.min(days, 90));
        return logRepository.findByPlayerIdAndLogDateBetweenOrderByLogDateDesc(playerId, start, end);
    }

    /**
     * Returns the current focus multiplier (0.55–1.10) for the player today.
     * Used by QuestService when computing XP earned from quest completions.
     */
    public double getTodayFocusMultiplier(Long playerId) {
        return logRepository.findByPlayerIdAndLogDate(playerId, LocalDate.now())
                .map(log -> computeFocusPct(log.getDopamineScore()) / 100.0)
                .orElse(1.0); // no log = assume clean day = 100% focus
    }

    // ── Score computation ──────────────────────────────────────────────────────

    /**
     * Computes the Dopamine Score (0–100):
     *   Social media > 30 min: +8 per 30-min block
     *   Reels/Shorts:          +15 per 30-min block (more addictive)
     *   Gaming > 60 min:       +12
     *   Junk food items:       +5 each
     *   Porn:                  +20
     *   Exercise done:         −20
     *   Cold shower:           −10
     */
    public int computeScore(DopamineLog log) {
        int score = 0;
        score += (log.getSocialMediaMin() / 30) * 8;
        score += (log.getReelsMin() / 30) * 15;
        if (log.getGamingMin() > 60) score += 12;
        score += log.getJunkFoodItems() * 5;
        if (log.isPornViewed()) score += 20;
        if (log.isExerciseDone()) score -= 20;
        if (log.isColdShower()) score -= 10;
        return Math.max(0, Math.min(100, score));
    }

    /**
     * Maps score to a focus percentage:
     *   Score 0–30:  100% (clean / disciplined day)
     *   Score 31–60: 85%  (mild dopamine load)
     *   Score 61–80: 70%  (significant impairment)
     *   Score 81+:   55%  (heavily compromised focus)
     */
    public int computeFocusPct(int score) {
        if (score <= 30) return 100;
        if (score <= 60) return 85;
        if (score <= 80) return 70;
        return 55;
    }

    /** Returns a summary map for the status window display. */
    public Map<String, Object> getTodaySummary(Long playerId) {
        DopamineLog log = getToday(playerId);
        return Map.of(
                "dopamineScore", log.getDopamineScore(),
                "focusPct", log.getFocusPct(),
                "focusMultiplier", log.getFocusPct() / 100.0,
                "aiNote", buildNote(log.getDopamineScore())
        );
    }

    private String buildNote(int score) {
        if (score <= 20) return "◈ Neural state: OPTIMAL. Full XP modifier active.";
        if (score <= 50) return "◈ Moderate dopamine load detected. Focus reduced.";
        if (score <= 80) return "◈ HIGH DOPAMINE. Your reward system is compromised. Earn less XP until you reset.";
        return "◈ CRITICAL DOPAMINE OVERLOAD. XP reduced by 45%. Exercise or cold shower to recover.";
    }
}
