package com.thesystem.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.thesystem.dto.AiCommanderBriefingDTO;
import com.thesystem.dto.QuestDTO;
import com.thesystem.entity.Player;
import com.thesystem.entity.PlayerStats;
import com.thesystem.exception.ApiException;
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
}
