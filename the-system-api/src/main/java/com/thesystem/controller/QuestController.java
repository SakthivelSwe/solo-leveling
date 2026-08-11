package com.thesystem.controller;

import com.thesystem.dto.CustomQuestRequest;
import com.thesystem.dto.DayProgressDTO;
import com.thesystem.dto.QuestCompletionResult;
import com.thesystem.dto.QuestDTO;
import com.thesystem.entity.Quest;
import com.thesystem.entity.QuestCategory;
import com.thesystem.exception.ApiException;
import com.thesystem.repository.QuestRepository;
import com.thesystem.service.PlayerService;
import com.thesystem.service.QuestService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/quests")
public class QuestController {

    private final QuestService questService;
    private final PlayerService playerService;
    private final QuestRepository questRepository;
    private final com.thesystem.service.AiQuestGeneratorService aiQuestGeneratorService;
    private final com.thesystem.service.AiProviderService aiProviderService;

    public QuestController(QuestService questService, PlayerService playerService,
                           QuestRepository questRepository,
                           com.thesystem.service.AiQuestGeneratorService aiQuestGeneratorService,
                           com.thesystem.service.AiProviderService aiProviderService) {
        this.questService = questService;
        this.playerService = playerService;
        this.questRepository = questRepository;
        this.aiQuestGeneratorService = aiQuestGeneratorService;
        this.aiProviderService = aiProviderService;
    }

    /** Manually triggers AI generation for new dynamic daily quests. */
    @PostMapping("/generate-ai")
    public Map<String, String> generateAiQuests(Principal principal) {
        aiQuestGeneratorService.generateDailyQuests(playerId(principal));
        return Map.of("status", "success", "message", "AI quests generated");
    }

    /** Gets AI quest suggestions for manual quest creation. */
    @GetMapping("/suggestions")
    public List<String> getQuestSuggestions(Principal principal, @RequestParam String category) {
        return aiQuestGeneratorService.generateQuestSuggestions(playerId(principal), category);
    }

    public static class SkipRequest {
        public String reason;
    }

    @PostMapping("/{questKey}/skip")
    public Map<String, String> skipQuest(Principal principal, @PathVariable String questKey, @RequestBody SkipRequest req) {
        questService.skipQuest(playerId(principal), questKey, req.reason);
        return Map.of("status", "success", "message", "Quest skipped successfully");
    }

    public static class CodeSubmission {
        public String code;
    }

    @PostMapping("/boss-battle/evaluate")
    public Map<String, Object> evaluateBossBattle(Principal principal, @RequestBody CodeSubmission submission) {
        // Lightweight AI evaluation logic for the code snippet
        String prompt = "You are Igris, the boss. The player is writing an algorithmic solution. " +
                        "Here is their code:\n" + submission.code + "\n\n" +
                        "If it has a compilation error or is O(n^2), mock them (max 1 sentence) and deal 10 damage to player (0 to boss). " +
                        "If it is correct and O(n), express fear/anger and deal 50 damage to boss (0 to player). " +
                        "Output JSON EXACTLY like: {\"feedback\": \"...\", \"damageToPlayer\": 10, \"damageToBoss\": 0}";
        
        try {
            String aiResponse = aiProviderService.generate(
                com.thesystem.service.AiProviderService.Scenario.BOSS_BATTLE,
                "You are Igris...",
                prompt
            );
            // Sometimes it wraps with ```json ... ```, strip it
            aiResponse = aiResponse.replaceAll("```json", "").replaceAll("```", "").trim();
            
            // Basic parsing, assuming it returns exactly what we want since we forced JSON output
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Map<String, Object> result = mapper.readValue(aiResponse, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
            
            // Apply damage if player is hit
            if (result.containsKey("damageToPlayer") && ((Number)result.get("damageToPlayer")).intValue() > 0) {
                playerService.takeDamage(playerId(principal), ((Number)result.get("damageToPlayer")).intValue(), "Boss Igris Strike");
            }
            
            return result;
        } catch (Exception e) {
            return Map.of("feedback", "Silence from the boss... (" + e.getMessage() + ")", "damageToPlayer", 0, "damageToBoss", 0);
        }
    }

    /** Today's DAILY quests (excludes MILESTONE/SIDE — those are on /milestones). */
    @GetMapping("/today")
    public List<QuestDTO> today(Principal principal) {
        return questService.getTodayQuests(playerId(principal));
    }

    /**
     * This week's WEEKLY quests with completion counts.
     * Resets every Monday midnight.
     */
    @GetMapping("/weekly")
    public List<QuestDTO> weekly(Principal principal) {
        return questService.getWeeklyQuests(playerId(principal));
    }

    /**
     * This month's MONTHLY quests with completion counts.
     * Resets every 1st of the month.
     */
    @GetMapping("/monthly")
    public List<QuestDTO> monthly(Principal principal) {
        return questService.getMonthlyQuests(playerId(principal));
    }

    /**
     * One-time MILESTONE quests (formerly SIDE quests).
     * Completed ones are marked done; they remain visible as achievements.
     */
    @GetMapping("/milestones")
    public List<QuestDTO> milestones(Principal principal) {
        return questService.getMilestoneQuests(playerId(principal));
    }

    @PostMapping("/{key}/complete")
    public QuestCompletionResult complete(
            Principal principal, 
            @PathVariable String key,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) String difficultyFeedback) {
        return questService.completeQuest(playerId(principal), key, lat, lng, difficultyFeedback);
    }

    @PostMapping("/{key}/verify")
    public Map<String, Object> verifyAndComplete(
            Principal principal, 
            @PathVariable String key, 
            @RequestBody Map<String, String> payload) {
        String base64Image = payload.get("image");
        String mimeType = payload.getOrDefault("mimeType", "image/jpeg");
        
        Quest q = questRepository.findByQuestKey(key)
            .orElseThrow(() -> new ApiException("Quest not found", HttpStatus.NOT_FOUND));
            
        String jsonResult = aiProviderService.verifyQuestImage(q.getLabel(), base64Image, mimeType);
            
        try {
            var node = new com.fasterxml.jackson.databind.ObjectMapper().readTree(jsonResult);
            boolean verified = node.path("verified").asBoolean(false);
            String reason = node.path("reason").asText("");
            
            if (verified) {
                QuestCompletionResult res = questService.completeQuest(playerId(principal), key, null, null, null);
                return Map.of("verified", true, "reason", reason, "result", res);
            } else {
                return Map.of("verified", false, "reason", reason);
            }
        } catch (Exception e) {
            throw new ApiException("AI verification failed", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/history")
    public List<DayProgressDTO> history(Principal principal) {
        return playerService.getWeeklyProgress(playerId(principal));
    }

    /**
     * Create a custom quest for the logged-in player.
     * XP defaults (Option C): DAILY=50, WEEKLY=150, MONTHLY=300 (user can override).
     */
    @PostMapping("/custom")
    public QuestDTO createCustomQuest(Principal principal, @Valid @RequestBody CustomQuestRequest req) {
        return questService.addCustomQuest(playerId(principal), req);
    }

    /**
     * Delete a custom quest (player-owned only).
     * Also cascades: removes all past completions of this quest by this player.
     */
    @DeleteMapping("/custom/{questKey}")
    public Map<String, String> deleteCustomQuest(Principal principal, @PathVariable String questKey) {
        questService.deleteCustomQuest(playerId(principal), questKey);
        return Map.of("status", "deleted", "questKey", questKey);
    }

    /** Toggle a quest's active flag — only for quests owned by the current player. */
    @PatchMapping("/{id}/toggle")
    public QuestDTO toggleQuest(Principal principal, @PathVariable Long id) {
        Long pid = playerId(principal);
        Quest q = questRepository.findById(id)
                .orElseThrow(() -> new ApiException("Quest not found", HttpStatus.NOT_FOUND));
        // Security: only allow toggling quests this player owns (ownerId == playerId)
        // System-wide quests (ownerId == null) cannot be toggled by any player.
        if (q.getOwnerId() == null || !q.getOwnerId().equals(pid)) {
            throw new ApiException("You do not have permission to modify this quest", HttpStatus.FORBIDDEN);
        }
        q.setActive(!q.isActive());
        q = questRepository.save(q);
        return questService.toDto(q, false);
    }

    private Long playerId(Principal principal) {
        return playerService.getByUsername(principal.getName()).getId();
    }
}

