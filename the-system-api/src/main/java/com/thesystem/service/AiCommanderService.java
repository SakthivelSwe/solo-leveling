package com.thesystem.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.thesystem.dto.AiCommanderBriefingDTO;
import com.thesystem.dto.AiDirectiveRequestDTO;
import com.thesystem.dto.QuestDTO;
import com.thesystem.dto.RawDirectiveItemDTO;
import com.thesystem.entity.Player;
import com.thesystem.entity.PlayerStats;
import com.thesystem.exception.ApiException;
import com.fasterxml.jackson.core.type.TypeReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import com.thesystem.service.AiProviderService;
import com.thesystem.service.PlayerService;
import com.thesystem.service.QuestService;

@Service
public class AiCommanderService {
    private static final Logger log = LoggerFactory.getLogger(AiCommanderService.class);

    private final AiProviderService aiProviderService;
    private final com.thesystem.repository.PlayerRepository playerRepository;
    private final com.thesystem.repository.PlayerStatsRepository statsRepository;
    private final QuestService questService;
    private final ObjectMapper mapper = new ObjectMapper();

    // Specific user focus context (as per user request: Angular Signals, DSA, etc.)
    // In the future this should be pulled from a user 'LifeFocus' table
    private static final String SAKTHI_FOCUS = """
            Career Goal: Switch to a higher-paying developer role.
            Current Focus: Angular (Signals, Routing, Guards), Spring Boot, and System Design.
            Weakness: English speaking confidence.
            """;

    public AiCommanderService(AiProviderService aiProviderService,
                              com.thesystem.repository.PlayerRepository playerRepository,
                              com.thesystem.repository.PlayerStatsRepository statsRepository,
                              QuestService questService) {
        this.aiProviderService = aiProviderService;
        this.playerRepository = playerRepository;
        this.statsRepository = statsRepository;
        this.questService = questService;
    }

    public AiCommanderBriefingDTO getMorningBriefing(Long playerId) {
        Player p = playerRepository.findById(playerId)
                .orElseThrow(() -> new ApiException("Player not found", HttpStatus.NOT_FOUND));
        PlayerStats stats = statsRepository.findByPlayerId(playerId)
                .orElseThrow(() -> new ApiException("Stats not found", HttpStatus.NOT_FOUND));
        
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        List<QuestDTO> yesterdayQuests = questService.getQuestsByDate(playerId, yesterday);
        List<QuestDTO> todayQuests = questService.getTodayQuests(playerId);

        long completedYesterday = yesterdayQuests.stream().filter(QuestDTO::isCompleted).count();
        int totalYesterday = yesterdayQuests.size();

        String yesterdaySummary = yesterdayQuests.stream()
                .map(q -> "- " + q.label() + " (" + (q.isCompleted() ? "Completed" : "Missed") + ")")
                .collect(Collectors.joining("\n"));

        String todaySummary = todayQuests.stream()
                .map(q -> "- " + q.label())
                .collect(Collectors.joining("\n"));

        String prompt = buildPrompt(p, stats, completedYesterday, totalYesterday, yesterdaySummary, todaySummary);

        try {
            String jsonResp = aiProviderService.generate(AiProviderService.Scenario.COACHING, "You are the AI Commander (Mentor) for a Developer Life OS.", prompt);
            return mapper.readValue(jsonResp, AiCommanderBriefingDTO.class);
        } catch (Exception e) {
            log.error("AI Commander generation failed", e);
            throw new ApiException("AI Commander failed to generate a briefing.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private String buildPrompt(Player player, PlayerStats stats, long comp, int tot, String yest, String today) {
        return "Your user is " + player.getUsername() + ", Level " + player.getLevel() + " (" + player.getRankLevel() + "-Rank).\n\n" +
               "User's Core Focus:\n" + SAKTHI_FOCUS + "\n\n" +
               "Yesterday's Performance (" + comp + "/" + tot + " quests):\n" + yest + "\n\n" +
               "Today's Active Quests:\n" + today + "\n\n" +
               "Task: Generate a morning briefing to coach the user. Be concise, direct, and slightly authoritative like a mentor. Do not use generic motivational quotes.\n" +
               "Output format must be strictly a JSON object (no markdown, no backticks):\n" +
               "{\n" +
               "  \"greeting\": \"Good morning, Hunter.\",\n" +
               "  \"yesterdayRecap\": \"Yesterday: Completed " + comp + "/" + tot + " quests...\",\n" +
               "  \"todayPriorities\": [\"1. Focus on Angular\", \"2. Drink water\"],\n" +
               "  \"feedback\": \"Your English practice is lagging. Prioritize it today.\",\n" +
               "  \"estimatedCompletionPct\": 85,\n" +
               "  \"expectedLevelUp\": \"2 days\"\n" +
               "}";
    }

    public List<RawDirectiveItemDTO> generateDirective(Long playerId, AiDirectiveRequestDTO req) {
        List<QuestDTO> todayQuests = questService.getTodayQuests(playerId);
        String questsStr = todayQuests.stream()
                .map(q -> "- [" + q.category() + "] " + q.label() + " (Priority: " + q.priority() + ")")
                .collect(Collectors.joining("\n"));

        String prompt = buildDirectivePrompt(req, questsStr);

        try {
            // Using Gemini for structured JSON array output
            String jsonResp = aiProviderService.generate(AiProviderService.Scenario.EVALUATION, "You are a life-scheduling AI generating a structured daily timeline.", prompt);
            
            // Clean markdown backticks if any
            jsonResp = jsonResp.replaceAll("```json", "").replaceAll("```", "").trim();
            
            return mapper.readValue(jsonResp, new TypeReference<List<RawDirectiveItemDTO>>() {});
        } catch (Exception e) {
            log.error("AI Directive generation failed", e);
            throw new ApiException("AI Directive failed to generate.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private String buildDirectivePrompt(AiDirectiveRequestDTO req, String quests) {
        return "Task: Generate a structured daily timeline ('Today's Directive') based on the user's active quests and daily anchor times.\n\n" +
               "Anchors:\n" +
               "- WAKE: " + req.getWakeTime() + "\n" +
               "- OFFICE_START (WORK block starts): " + req.getOfficeStart() + "\n" +
               "- OFFICE_END (EVENING block starts): " + req.getOfficeEnd() + "\n" +
               "- SLEEP (NIGHT block ends): " + req.getSleepTime() + "\n\n" +
               "Active Quests:\n" + quests + "\n\n" +
               "Rules:\n" +
               "1. You MUST include exactly 4 anchor tasks in the array. Their properties MUST be exactly:\n" +
               "   - { \"id\": \"wake\", \"action\": \"Wake up\", \"category\": \"REST\", \"block\": \"MORNING\", \"offsetMins\": 0, \"anchorKey\": \"WAKE\", \"tags\": [] }\n" +
               "   - { \"id\": \"office_in\", \"action\": \"Office login\", \"category\": \"REST\", \"block\": \"WORK\", \"offsetMins\": 0, \"anchorKey\": \"OFFICE_START\", \"tags\": [] }\n" +
               "   - { \"id\": \"office_out\", \"action\": \"Office logoff\", \"category\": \"REST\", \"block\": \"EVENING\", \"offsetMins\": 0, \"anchorKey\": \"OFFICE_END\", \"tags\": [] }\n" +
               "   - { \"id\": \"sleep\", \"action\": \"Sleep\", \"category\": \"DAILY\", \"block\": \"NIGHT\", \"offsetMins\": 0, \"anchorKey\": \"SLEEP\", \"tags\": [\"SLEEP\"] }\n" +
               "2. Map the user's Active Quests into logical times during the day. Assign each to the correct block (MORNING, WORK, EVENING, or NIGHT) and give it an 'offsetMins' relative to that block's anchor.\n" +
               "   - MORNING offsets are positive minutes from WAKE (e.g. offsetMins=30 means 30 mins after wake).\n" +
               "   - WORK offsets are positive minutes from OFFICE_START.\n" +
               "   - EVENING offsets are positive minutes from OFFICE_END.\n" +
               "   - NIGHT offsets are NEGATIVE minutes from SLEEP (e.g. offsetMins=-60 means 60 mins before sleep).\n" +
               "3. Ensure the schedule is realistic and spaces out the tasks.\n" +
               "4. Output format MUST be strictly a JSON array (no markdown code blocks, no backticks, just the array `[ {...} ]`).\n" +
               "5. For non-anchor items, DO NOT provide an 'anchorKey'. Give them a unique 'id' like 'q_1', 'q_2', etc.\n" +
               "6. Keep tags brief (1-2 words max, uppercase).";
    }
}
