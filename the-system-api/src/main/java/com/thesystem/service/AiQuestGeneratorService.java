package com.thesystem.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.thesystem.dto.StatsDTO;
import com.thesystem.entity.Player;
import com.thesystem.entity.PlayerSkill;
import com.thesystem.entity.PlayerStats;
import com.thesystem.entity.Quest;
import com.thesystem.entity.QuestCategory;
import com.thesystem.repository.PlayerRepository;
import com.thesystem.repository.PlayerSkillRepository;
import com.thesystem.repository.PlayerStatsRepository;
import com.thesystem.repository.QuestRepository;
import com.thesystem.repository.QuestCompletionRepository;
import com.thesystem.repository.OnboardingAssessmentRepository;
import com.thesystem.entity.OnboardingAssessment;
import com.thesystem.entity.QuestCompletion;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class AiQuestGeneratorService {

    private static final Logger log = LoggerFactory.getLogger(AiQuestGeneratorService.class);

    private final AiProviderService aiProviderService;
    private final PlayerRepository playerRepository;
    private final PlayerStatsRepository statsRepository;
    private final PlayerSkillRepository skillRepository;
    private final QuestRepository questRepository;
    private final com.thesystem.repository.QuestSkipRepository skipRepository;
    private final QuestCompletionRepository completionRepository;
    private final OnboardingAssessmentRepository onboardingRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AiQuestGeneratorService(AiProviderService aiProviderService,
                                   PlayerRepository playerRepository,
                                   PlayerStatsRepository statsRepository,
                                   PlayerSkillRepository skillRepository,
                                   com.thesystem.repository.QuestSkipRepository skipRepository,
                                   QuestRepository questRepository,
                                   QuestCompletionRepository completionRepository,
                                   OnboardingAssessmentRepository onboardingRepository) {
        this.aiProviderService = aiProviderService;
        this.playerRepository = playerRepository;
        this.statsRepository = statsRepository;
        this.skillRepository = skillRepository;
        this.skipRepository = skipRepository;
        this.questRepository = questRepository;
        this.completionRepository = completionRepository;
        this.onboardingRepository = onboardingRepository;
    }

    /**
     * Generates and assigns new AI quests for a player.
     * Deactivates their previous AI-generated quests so they don't pile up in the UI.
     */
    @Transactional
    public void generateDailyQuests(Long playerId) {
        Optional<Player> pOpt = playerRepository.findById(playerId);
        if (pOpt.isEmpty()) return;
        Player player = pOpt.get();

        PlayerStats stats = statsRepository.findByPlayerId(playerId).orElse(new PlayerStats());
        List<PlayerSkill> skills = skillRepository.findByPlayerId(playerId);

        // Deactivate old AI quests for this player
        List<Quest> existing = questRepository.findByOwnerIdAndActiveTrueOrderByIdDesc(playerId);
        for (Quest q : existing) {
            if (q.getQuestKey() != null && q.getQuestKey().startsWith("AI_")) {
                q.setActive(false);
                questRepository.save(q);
            }
        }

        // Build the prompt with REAL user context
        // Determine physical capacity tier for accurate quest generation
        int strStat = stats.getStrength();
        String physicalTier;
        String physicalExamples;
        if (strStat < 10) {
            physicalTier = "TRUE BEGINNER (STR < 10)";
            physicalExamples = """
                    FORBIDDEN physical quests: standard push-ups, pull-ups, burpees, jump squats.
                    REQUIRED beginner alternatives:
                      - Push-up equivalent: "Wall Push-ups 3×10" or "Incline Push-ups (on table) 3×8"
                      - Pull-up equivalent: "Dead Hang from bar 3×10 seconds" or "Inverted Row under a table 3×8"
                      - Core: "Knee Sit-ups 3×10" or "Plank hold 3×15 seconds"
                      - Legs: "Bodyweight Squats 3×10" or "Wall Sit 3×20 seconds"
                      - Cardio: "10-min brisk walk outside"
                    WHY: At STR < 10, the Hunter cannot perform full push-ups. Wall push-ups train the EXACT same muscles with less bodyweight — this is the scientifically correct starting point.""";
        } else if (strStat < 25) {
            physicalTier = "INTERMEDIATE BEGINNER (STR 10-24)";
            physicalExamples = """
                    Physical quests: Use incline push-ups, knee push-ups, assisted squats, inverted rows.
                    AVOID: standard pull-ups, heavy weighted exercises.
                    ALLOWED: "Knee Push-Ups 3×10", "Incline Push-Ups (chair height) 3×10", "Negative Pull-Up 1×3 (slow lower)", "Squats 3×15".""";
        } else {
            physicalTier = "INTERMEDIATE (STR >= 25)";
            physicalExamples = "Standard bodyweight quests are appropriate: push-ups, squats, planks, running.";
        }

        // Fetch Onboarding Assessment limits
        int maxMins = 60; // Default
        String barrierStr = "";
        Optional<OnboardingAssessment> optAssessment = onboardingRepository.findByPlayerId(playerId);
        if (optAssessment.isPresent()) {
            maxMins = optAssessment.get().getAvailableTimeMinutes();
            barrierStr = "Primary Barrier: " + optAssessment.get().getPrimaryBarrier() + "\n";
        }

        // Check if player is in recovery mode (HP < 40)
        boolean isRecoveryMode = player.getHp() < 40;
        String recoveryInstruction = isRecoveryMode ? 
            "CRITICAL ALARM: The Hunter is in RECOVERY MODE (HP < 40). They are burned out or missed several days. DO NOT assign heavy/hard technical or physical tasks. Focus ONLY on extremely light habits to rebuild momentum (e.g. Drink 1L water, 5 min stretch, read 1 page)." 
            : "";

        String systemPrompt = """
                You are THE SYSTEM from Solo Leveling — a ruthless but accurate mentor.
                Generate hyper-specific, actionable daily quests for a Hunter with the following EXACT profile:


                HUNTER PROFILE:
                - Name: Sakthivel (26 years old, male, based in Chennai, India)
                - Goal: Switch from current job to a higher-paying developer role (target: ₹15-25 LPA)
                - Current Job: Working at TVM Infotech on production Angular + Spring Boot projects
                - Daily Time Available: ~2-3 hours after work for self-improvement
                - Level: %d | Rank: %s

                CURRENT STATS (0 = untrained, higher = stronger):
                STR(Fitness)=%d  INT(Tech)=%d  VIT(Health/Sleep)=%d  AGI(English)=%d  PER(Problem-Solving)=%d  DIS(Discipline)=%d

                PHYSICAL CAPACITY: %s
                %s

                ACTIVE SKILLS:
                %s

                QUEST SYSTEM CATEGORIES (use EXACTLY one of these strings):
                - "DAILY"       → Physical habits (exercise, sleep, hydration, sunlight)
                - "SKILL"       → Technical/career tasks (coding, DSA, system design, English)
                - "DISCIPLINE"  → Mental fortitude (no porn/reels, cold shower, journaling)
                - "TESTOSTERONE"→ Hormone/vitality optimization (zinc meals, morning sun, no soda, exercise)

                CRITICAL RULES — VIOLATION = REJECTED:
                1. ZERO VAGUENESS: Every quest label must say EXACTLY what to do, how long, and why.
                   BAD: "Practice coding"  GOOD: "[SKILL] Solve 1 LeetCode Medium (arrays/hashmap) — no AI, 30 min"
                2. TECH ACCURACY: Only generate tech quests for skills the Hunter actually uses: Angular (Signals, Guards, Routing), Spring Boot (REST, JPA), Java (OOP, streams), DSA/LeetCode, System Design, English speaking.
                3. REALISTIC TIME: Each quest must be completable in 20-60 min after a full workday.
                4. STAT ALIGNMENT: Quest xpReward and statBoosts must directly match the quest activity.
                5. DYNAMIC DIFFICULTY: If Level < 3, quests MUST be beginner-friendly (e.g., "Read 1 article", "Watch 1 tutorial"). If Level >= 5, increase difficulty (e.g., "Build a component"). If Level >= 10, use advanced tasks ("Mock interview", "System Architecture").
                6. PHYSICAL ACCURACY: Follow the PHYSICAL CAPACITY rules above with absolute strictness. Assigning "10 push-ups" when STR < 10 is a system error — it causes the Hunter to fail and quit.
                7. Generate exactly 3 SKILL quests + 1 DISCIPLINE or DAILY habit quest.
                8. Output ONLY a raw JSON array. NO markdown, NO backticks, NO explanation.

                JSON SCHEMA (follow exactly):
                [
                  {
                    "label": "[SKILL] Solve 1 LeetCode Medium problem (Two Pointers/HashMap) — no AI — 35 min",
                    "category": "SKILL",
                    "xpReward": 120,
                    "statBoosts": {"INT": 3, "PER": 4},
                    "skillBoosts": {"DSA / LeetCode": 4}
                  }
                ]
                """.formatted(
                        player.getLevel(), player.getRankLevel(),
                        stats.getStrength(), stats.getIntelligence(), stats.getVitality(),
                        stats.getAgility(), stats.getPerception(), stats.getDis(),
                        physicalTier, physicalExamples,
                        formatSkills(skills)
                );

        List<com.thesystem.entity.QuestSkip> recentSkips = skipRepository.findByPlayerIdAndSkippedAt(playerId, java.time.LocalDate.now().minusDays(1));
        recentSkips.addAll(skipRepository.findByPlayerIdAndSkippedAt(playerId, java.time.LocalDate.now()));

        StringBuilder skipContext = new StringBuilder();
        if (!recentSkips.isEmpty()) {
            // Batch-load quest labels in ONE query instead of one findById per skip (avoids N+1).
            java.util.Set<Long> skipQuestIds = recentSkips.stream()
                    .map(com.thesystem.entity.QuestSkip::getQuestId)
                    .collect(java.util.stream.Collectors.toSet());
            Map<Long, String> skipLabels = questRepository.findAllById(skipQuestIds).stream()
                    .collect(java.util.stream.Collectors.toMap(Quest::getId, Quest::getLabel));

            skipContext.append("\nRECENT SKIPS (Take these reasons into account):\n");
            for (com.thesystem.entity.QuestSkip skip : recentSkips) {
                String questLabel = skipLabels.getOrDefault(skip.getQuestId(), "Unknown Quest");
                skipContext.append("- Skipped '").append(questLabel).append("' because: ").append(skip.getReason()).append("\n");
            }
            skipContext.append("If a reason implies injury or illness, DO NOT assign heavy physical tasks today. If they were busy/overworked, give lighter tasks.\n");
        }

        // Fetch Recent Quest Difficulty Feedback
        List<QuestCompletion> recentFeedback = completionRepository.findTop5ByPlayerIdAndDifficultyFeedbackIsNotNullOrderByCompletedAtDesc(playerId);
        StringBuilder feedbackContext = new StringBuilder();
        if (!recentFeedback.isEmpty()) {
            // Batch-load quest labels in ONE query instead of one findById per completion (avoids N+1).
            java.util.Set<Long> feedbackQuestIds = recentFeedback.stream()
                    .map(QuestCompletion::getQuestId)
                    .collect(java.util.stream.Collectors.toSet());
            Map<Long, String> feedbackLabels = questRepository.findAllById(feedbackQuestIds).stream()
                    .collect(java.util.stream.Collectors.toMap(Quest::getId, Quest::getLabel));

            feedbackContext.append("\nRECENT QUEST DIFFICULTY FEEDBACK (Scale future quests based on this):\n");
            for (QuestCompletion qc : recentFeedback) {
                String questLabel = feedbackLabels.getOrDefault(qc.getQuestId(), "Unknown Quest");
                feedbackContext.append("- Rated '").append(questLabel).append("' as: ").append(qc.getDifficultyFeedback()).append("\n");
            }
            feedbackContext.append("RULE: If they rated a quest TOO_EASY, make similar tasks harder (increase reps or complexity). If they rated it HARD, reduce the difficulty next time.\n");
        }

        String userPrompt = "Generate today's 4 quests based on my profile and current stats. Focus on my weakest areas.\n" 
                + barrierStr
                + "Maximum total time allowed for ALL 4 quests combined today: " + maxMins + " minutes.\n"
                + recoveryInstruction
                + skipContext.toString() 
                + feedbackContext.toString();

        try {
            // Use Gemini for structured JSON
            String json = aiProviderService.generate(AiProviderService.Scenario.EVALUATION, systemPrompt, userPrompt);
            json = cleanJson(json);

            List<Map<String, Object>> generatedQuests = objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {});

            for (Map<String, Object> gq : generatedQuests) {
                String label = (String) gq.get("label");
                String categoryStr = (String) gq.get("category");
                if (label == null || label.isBlank() || categoryStr == null) {
                    log.warn("Skipping malformed AI quest (missing label/category): {}", gq);
                    continue;
                }

                // Safe numeric parse — Jackson may hand back Integer, Long or Double.
                Object rawXp = gq.get("xpReward");
                int xpReward = (rawXp instanceof Number n) ? n.intValue() : 100;
                // Clamp so a hallucinated reward can never inflate the XP economy.
                xpReward = Math.max(10, Math.min(300, xpReward));

                Map<String, Integer> statBoosts = sanitizeBoosts(gq.get("statBoosts"));
                Map<String, Integer> skillBoosts = sanitizeBoosts(gq.get("skillBoosts"));

                QuestCategory category;
                try { category = QuestCategory.valueOf(categoryStr); }
                catch (Exception e) { category = QuestCategory.DAILY; }

                String questKey = "AI_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                Quest q = new Quest(questKey, label, category, xpReward, statBoosts, skillBoosts);
                q.setTimeType("DAILY");
                q.setCustom(true);
                q.setOwnerId(playerId);
                q.setPriority(3);
                q.setActive(true);

                questRepository.save(q);
            }
            log.info("Successfully generated AI quests for player {}", playerId);

        } catch (Exception e) {
            log.error("Failed to generate AI quests for player {}", playerId, e);
        }
    }

    /**
     * Generates context-aware quest suggestions for the manual Add Quest form.
     */
    public List<String> generateQuestSuggestions(Long playerId, String category) {
        Optional<Player> pOpt = playerRepository.findById(playerId);
        if (pOpt.isEmpty()) return List.of();
        Player player = pOpt.get();

        PlayerStats stats = statsRepository.findByPlayerId(playerId).orElse(new PlayerStats());

        String systemPrompt = """
                You are THE SYSTEM from Solo Leveling.
                The Hunter is manually creating a custom quest for the category: %s.
                Based on their stats (Level %d, STR: %d, INT: %d, VIT: %d, DIS: %d), 
                generate exactly 5 short, actionable quest labels (max 50 chars each).
                Make them realistic habits for a developer.
                Return ONLY a JSON array of strings. No markdown, no explanation.
                Example output:
                ["Drink 1L of water", "Read 5 pages", "Do 20 push-ups"]
                """;
        
        String prompt = String.format(systemPrompt, category, player.getLevel(), 
                                      stats.getStrength(), stats.getIntelligence(), 
                                      stats.getVitality(), stats.getDis());

        try {
            String rawResponse = aiProviderService.generate(
                    AiProviderService.Scenario.SUGGESTION, prompt, "Give me 5 quest suggestions.");
            String clean = cleanJson(rawResponse);
            return objectMapper.readValue(clean, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            log.error("Failed to generate quest suggestions for category {}", category, e);
            // Fallback suggestions
            return List.of("Read 5 pages", "10 min stretch", "Deep work session");
        }
    }

    private String formatSkills(List<PlayerSkill> skills) {
        if (skills.isEmpty()) return "None";
        StringBuilder sb = new StringBuilder();
        for (PlayerSkill s : skills) {
            sb.append(s.getSkillName()).append(" (Lv ").append(s.getSkillLevel()).append("), ");
        }
        return sb.toString();
    }

    /**
     * Coerces an AI-supplied boosts object into a clean Map<String,Integer>,
     * dropping non-numeric values and clamping each boost to a sane range so a
     * hallucinated value can never distort a player's stats.
     */
    @SuppressWarnings("unchecked")
    private Map<String, Integer> sanitizeBoosts(Object raw) {
        if (!(raw instanceof Map<?, ?> map)) return Map.of();
        Map<String, Integer> clean = new java.util.HashMap<>();
        for (Map.Entry<?, ?> e : map.entrySet()) {
            if (e.getKey() == null || !(e.getValue() instanceof Number n)) continue;
            int v = Math.max(0, Math.min(10, n.intValue()));
            if (v > 0) clean.put(String.valueOf(e.getKey()), v);
        }
        return clean;
    }

    private String cleanJson(String raw) {
        String clean = raw.trim();
        if (clean.startsWith("```json")) {
            clean = clean.substring(7);
        } else if (clean.startsWith("```")) {
            clean = clean.substring(3);
        }
        if (clean.endsWith("```")) {
            clean = clean.substring(0, clean.length() - 3);
        }
        return clean.trim();
    }
}
