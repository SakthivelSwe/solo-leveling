package com.thesystem.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.thesystem.entity.OnboardingAssessment;
import com.thesystem.entity.Player;
import com.thesystem.entity.PlayerStats;
import com.thesystem.exception.ApiException;
import com.thesystem.repository.OnboardingAssessmentRepository;
import com.thesystem.repository.PlayerRepository;
import com.thesystem.repository.PlayerStatsRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Handles the initial onboarding assessment flow for new players.
 *
 * Algorithm:
 * 1. Receive questionnaire answers (activity level, time available, primary goal, barriers)
 * 2. Calculate domain baseline scores (0-100) from answers
 * 3. Map domain scores to PlayerStats (STR, INT, VIT, AGI, PER, DIS)
 * 4. Mark player onboarding as complete
 * 5. Return the starting profile to the frontend
 *
 * Scoring is based on:
 * - Tiny Habits (BJ Fogg): start small, anchor to existing behavior
 * - Self-Determination Theory: autonomy, competence, relatedness
 * - Progressive overload: calibrate to current ability, not target ability
 */
@Service
public class OnboardingService {

    private final OnboardingAssessmentRepository assessmentRepository;
    private final PlayerRepository playerRepository;
    private final PlayerStatsRepository statsRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public OnboardingService(OnboardingAssessmentRepository assessmentRepository,
                             PlayerRepository playerRepository,
                             PlayerStatsRepository statsRepository) {
        this.assessmentRepository = assessmentRepository;
        this.playerRepository = playerRepository;
        this.statsRepository = statsRepository;
    }

    /**
     * Processes the onboarding questionnaire submission.
     * Converts qualitative answers into domain scores and updates player stats.
     *
     * @param playerId the authenticated player
     * @param answers  map of question keys to string answers from the frontend
     * @return a starting profile summary for display to the user
     */
    @Transactional
    public OnboardingResult submitAssessment(Long playerId, Map<String, String> answers) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new ApiException("Player not found", HttpStatus.NOT_FOUND));

        // Calculate domain scores from answers (0-100 continuous scale)
        int bodyScore       = calcBodyScore(answers);
        int careerScore     = calcCareerScore(answers);
        int disciplineScore = calcDisciplineScore(answers);
        int englishScore    = calcEnglishScore(answers);
        int mindScore       = calcMindScore(answers);
        int availableTime   = parseAvailableTime(answers);
        String primaryGoal  = answers.getOrDefault("primaryGoal", "improve_life");
        String primaryBarrier = answers.getOrDefault("primaryBarrier", "");

        // Store assessment
        OnboardingAssessment assessment = new OnboardingAssessment();
        assessment.setPlayerId(playerId);
        try { assessment.setAnswersJson(objectMapper.writeValueAsString(answers)); } catch (Exception ignored) {}
        assessment.setBodyScore(bodyScore);
        assessment.setMindScore(mindScore);
        assessment.setCareerScore(careerScore);
        assessment.setDisciplineScore(disciplineScore);
        assessment.setEnglishScore(englishScore);
        assessment.setAvailableTimeMinutes(availableTime);
        assessment.setPrimaryGoal(primaryGoal);
        assessment.setPrimaryBarrier(primaryBarrier);
        assessment.setCompletedAt(LocalDateTime.now());
        assessmentRepository.save(assessment);

        // Map domain scores to PlayerStats
        // Domain 0-100 scale → Stat 0-50 scale (stats start at 10 by default for new players)
        // Formula: stat = max(1, round(domainScore / 2))
        PlayerStats stats = statsRepository.findByPlayerId(playerId)
                .orElseThrow(() -> new ApiException("Stats not found", HttpStatus.NOT_FOUND));

        stats.setStrength(mapDomainToStat(bodyScore));          // STR = fitness
        stats.setIntelligence(mapDomainToStat(careerScore));    // INT = tech/career
        stats.setVitality(mapDomainToStat(bodyScore + mindScore, 200));    // VIT = health/energy (blend)
        stats.setAgility(mapDomainToStat(englishScore));        // AGI = communication
        stats.setPerception(mapDomainToStat(careerScore));      // PER = problem-solving
        stats.setDis(mapDomainToStat(disciplineScore));         // DIS = discipline
        statsRepository.save(stats);

        // Mark onboarding complete
        player.setOnboardingComplete(true);
        playerRepository.save(player);

        // Build human-readable starting profile
        return buildStartingProfile(bodyScore, careerScore, disciplineScore, englishScore, mindScore, availableTime, primaryGoal);
    }

    // ── Domain Score Calculators ───────────────────────────────────────────────

    /**
     * Body score (0-100): based on current physical activity level.
     * Tiny Habits principle: "Almost never active" → score 5 (not 0 — everyone can walk).
     */
    private int calcBodyScore(Map<String, String> a) {
        return switch (a.getOrDefault("activityLevel", "never")) {
            case "never"      -> 8;   // Can do: 5-min walk
            case "sometimes"  -> 22;  // Can do: walks sometimes
            case "regularly"  -> 50;  // Exercises 3×/week
            case "daily"      -> 75;  // Exercises most days
            default           -> 10;
        };
    }

    /**
     * Career score (0-100): based on current learning consistency.
     */
    private int calcCareerScore(Map<String, String> a) {
        int base = switch (a.getOrDefault("learningConsistency", "never")) {
            case "never"     -> 10;
            case "sometimes" -> 25;
            case "regularly" -> 55;
            case "daily"     -> 75;
            default          -> 15;
        };
        // Boost if they have an active career goal
        if ("better_job".equals(a.getOrDefault("primaryGoal", ""))) base += 10;
        return Math.min(base, 100);
    }

    /**
     * Discipline score (0-100): based on habit consistency and morning routine.
     */
    private int calcDisciplineScore(Map<String, String> a) {
        return switch (a.getOrDefault("disciplineLevel", "low")) {
            case "low"       -> 8;
            case "medium"    -> 30;
            case "high"      -> 60;
            default          -> 10;
        };
    }

    /**
     * English score (0-100): based on confidence and frequency of use.
     */
    private int calcEnglishScore(Map<String, String> a) {
        return switch (a.getOrDefault("englishLevel", "beginner")) {
            case "beginner"      -> 10;
            case "conversational"-> 35;
            case "fluent"        -> 70;
            default              -> 15;
        };
    }

    /**
     * Mind score (0-100): based on stress management and focus ability.
     */
    private int calcMindScore(Map<String, String> a) {
        return switch (a.getOrDefault("stressLevel", "high")) {
            case "high"   -> 10;  // Poor stress management
            case "medium" -> 35;
            case "low"    -> 65;  // Good stress management
            default       -> 20;
        };
    }

    /**
     * Parse available time from answer key to integer minutes.
     */
    private int parseAvailableTime(Map<String, String> a) {
        return switch (a.getOrDefault("availableTime", "30")) {
            case "15"  -> 15;
            case "30"  -> 30;
            case "60"  -> 60;
            case "90"  -> 90;
            default    -> 30;
        };
    }

    /**
     * Map domain score (0-100) to PlayerStats scale (1-50).
     * Very beginners start at 2-5. Advanced starts at 35-50.
     */
    private int mapDomainToStat(int domainScore) {
        return Math.max(2, Math.round(domainScore / 2.0f));
    }

    /** Overload for blended scores from two domains (e.g. VIT = body + mind average). */
    private int mapDomainToStat(int sum, int maxSum) {
        return mapDomainToStat((int)(((double) sum / maxSum) * 100));
    }

    // ── Starting Profile Builder ───────────────────────────────────────────────

    /**
     * Converts numeric scores into a human-readable starting profile for the frontend.
     * The user should NOT see numbers — they see level labels and a focus area.
     */
    private OnboardingResult buildStartingProfile(int body, int career, int discipline,
                                                   int english, int mind,
                                                   int availableTime, String goal) {
        String bodyLabel       = domainLabel(body);
        String careerLabel     = domainLabel(career);
        String disciplineLabel = domainLabel(discipline);
        String englishLabel    = domainLabel(english);
        String mindLabel       = domainLabel(mind);

        // Determine primary focus areas (lowest scores = highest priority)
        // Based on Self-Determination Theory: competence-building in weakest area first
        String focus1 = lowestDomain(body, career, discipline, english, mind);
        String focus2 = secondLowest(body, career, discipline, english, mind, focus1);

        int dailyQuestCount = availableTime <= 15 ? 2 : availableTime <= 30 ? 3 : 4;

        String message = buildWelcomeMessage(focus1, focus2, dailyQuestCount);

        return new OnboardingResult(
                bodyLabel, careerLabel, disciplineLabel, englishLabel, mindLabel,
                focus1, focus2, dailyQuestCount, message
        );
    }

    private String domainLabel(int score) {
        if (score < 15) return "Foundation";
        if (score < 35) return "Beginner";
        if (score < 55) return "Developing";
        if (score < 75) return "Strong";
        return "Advanced";
    }

    private String lowestDomain(int body, int career, int discipline, int english, int mind) {
        int min = Math.min(body, Math.min(career, Math.min(discipline, Math.min(english, mind))));
        if (min == body)       return "Body";
        if (min == career)     return "Career";
        if (min == discipline) return "Discipline";
        if (min == english)    return "English";
        return "Mind";
    }

    private String secondLowest(int body, int career, int discipline, int english, int mind, String lowest) {
        // Remove the lowest domain and find next lowest
        int b = "Body".equals(lowest)       ? Integer.MAX_VALUE : body;
        int c = "Career".equals(lowest)     ? Integer.MAX_VALUE : career;
        int d = "Discipline".equals(lowest) ? Integer.MAX_VALUE : discipline;
        int e = "English".equals(lowest)    ? Integer.MAX_VALUE : english;
        int m = "Mind".equals(lowest)       ? Integer.MAX_VALUE : mind;
        int min = Math.min(b, Math.min(c, Math.min(d, Math.min(e, m))));
        if (min == b) return "Body";
        if (min == c) return "Career";
        if (min == d) return "Discipline";
        if (min == e) return "English";
        return "Mind";
    }

    private String buildWelcomeMessage(String focus1, String focus2, int questCount) {
        return "I understand your starting point. For now, we will focus on " + focus1.toLowerCase()
                + " and " + focus2.toLowerCase()
                + ". You will see " + questCount + " small actions each day. "
                + "Complete these consistently — the system adapts as you grow.";
    }

    // ── Result DTO ────────────────────────────────────────────────────────────

    public record OnboardingResult(
            String bodyLevel,
            String careerLevel,
            String disciplineLevel,
            String englishLevel,
            String mindLevel,
            String primaryFocus,
            String secondaryFocus,
            int dailyQuestCount,
            String welcomeMessage
    ) {}
}
