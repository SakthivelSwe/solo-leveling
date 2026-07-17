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

        // Build the prompt
        String systemPrompt = "You are THE SYSTEM from Solo Leveling. Your task is to generate realistic, level-appropriate daily quests for a Hunter.\n" +
                "The user is Level " + player.getLevel() + " (Rank: " + player.getRankLevel() + ").\n" +
                "Stats: STR " + stats.getStrength() + ", INT " + stats.getIntelligence() + ", VIT " + stats.getVitality() + 
                ", AGI " + stats.getAgility() + ", PER " + stats.getPerception() + ", HOR " + stats.getHor() + ".\n" +
                "Skills: " + formatSkills(skills) + "\n\n" +
                "Rules:\n" +
                "1. If a skill is Level 0-5, give them absolute beginner quests (e.g. 'Watch 1 HTML tutorial', 'Learn 5 English words').\n" +
                "2. If a skill is Level 20+, give them advanced quests (e.g. 'Optimize SQL query', 'Mock interview').\n" +
                "3. Keep physical quests realistic based on STR/VIT.\n" +
                "4. Generate exactly 3 SKILL quests and 1 TESTOSTERONE/health quest.\n" +
                "5. Provide output strictly as a JSON array of objects. No markdown formatting, no backticks, ONLY raw JSON.\n\n" +
                "Schema for each object:\n" +
                "[\n" +
                "  {\n" +
                "    \"label\": \"[SKILL] Read 1 page of documentation\",\n" +
                "    \"category\": \"SKILL\",\n" +
                "    \"xpReward\": 80,\n" +
                "    \"statBoosts\": \"{\\\"INT\\\":2}\",\n" +
                "    \"skillBoosts\": \"{\\\"Java + Spring Boot\\\":1}\"\n" +
                "  }\n" +
                "]";

        String userPrompt = "Generate my daily quests based on my current level.";

        try {
            // Use Gemini for structured JSON
            String json = aiProviderService.generate(AiProviderService.Scenario.EVALUATION, systemPrompt, userPrompt);
            json = cleanJson(json);

            List<Map<String, Object>> generatedQuests = objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {});

            for (Map<String, Object> gq : generatedQuests) {
                String label = (String) gq.get("label");
                String categoryStr = (String) gq.get("category");
                int xpReward = (Integer) gq.get("xpReward");
                String statBoosts = (String) gq.get("statBoosts");
                String skillBoosts = (String) gq.get("skillBoosts");

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
