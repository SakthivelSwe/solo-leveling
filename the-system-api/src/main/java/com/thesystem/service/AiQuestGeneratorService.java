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
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AiQuestGeneratorService(AiProviderService aiProviderService,
                                   PlayerRepository playerRepository,
                                   PlayerStatsRepository statsRepository,
                                   PlayerSkillRepository skillRepository,
                                   QuestRepository questRepository) {
        this.aiProviderService = aiProviderService;
        this.playerRepository = playerRepository;
        this.statsRepository = statsRepository;
        this.skillRepository = skillRepository;
        this.questRepository = questRepository;
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
                6. Generate exactly 3 SKILL quests + 1 DISCIPLINE or DAILY habit quest.
                7. Output ONLY a raw JSON array. NO markdown, NO backticks, NO explanation.

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
                        formatSkills(skills)
                );

        String userPrompt = "Generate today's 4 quests based on my profile and current stats. Focus on my weakest areas.";

        try {
            // Use Gemini for structured JSON
            String json = aiProviderService.generate(AiProviderService.Scenario.EVALUATION, systemPrompt, userPrompt);
            json = cleanJson(json);

            List<Map<String, Object>> generatedQuests = objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {});

            for (Map<String, Object> gq : generatedQuests) {
                String label = (String) gq.get("label");
                String categoryStr = (String) gq.get("category");
                int xpReward = (Integer) gq.get("xpReward");
                Map<String, Integer> statBoosts = (Map<String, Integer>) gq.get("statBoosts");
                Map<String, Integer> skillBoosts = (Map<String, Integer>) gq.get("skillBoosts");

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

    private String formatSkills(List<PlayerSkill> skills) {
        if (skills.isEmpty()) return "None";
        StringBuilder sb = new StringBuilder();
        for (PlayerSkill s : skills) {
            sb.append(s.getSkillName()).append(" (Lv ").append(s.getSkillLevel()).append("), ");
        }
        return sb.toString();
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
