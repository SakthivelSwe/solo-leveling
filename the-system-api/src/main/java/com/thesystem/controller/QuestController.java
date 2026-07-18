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

    public QuestController(QuestService questService, PlayerService playerService,
                           QuestRepository questRepository,
                           com.thesystem.service.AiQuestGeneratorService aiQuestGeneratorService) {
        this.questService = questService;
        this.playerService = playerService;
        this.questRepository = questRepository;
        this.aiQuestGeneratorService = aiQuestGeneratorService;
    }

    /** Manually triggers AI generation for new dynamic daily quests. */
    @PostMapping("/generate-ai")
    public Map<String, String> generateAiQuests(Principal principal) {
        aiQuestGeneratorService.generateDailyQuests(playerId(principal));
        return Map.of("status", "success", "message", "AI quests generated");
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

    /** Complete a quest — window enforced per timeType (today/week/month/never). */
    @PostMapping("/{key}/complete")
    public QuestCompletionResult complete(Principal principal, @PathVariable String key) {
        return questService.completeQuest(playerId(principal), key);
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
    public QuestDTO createCustomQuest(Principal principal, @RequestBody CustomQuestRequest req) {
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

    /** Toggle a quest's active flag (for system settings panel). */
    @PatchMapping("/{id}/toggle")
    public QuestDTO toggleQuest(Principal principal, @PathVariable Long id) {
        Quest q = questRepository.findById(id)
                .orElseThrow(() -> new ApiException("Quest not found", HttpStatus.NOT_FOUND));
        q.setActive(!q.isActive());
        q = questRepository.save(q);
        return questService.toDto(q, false);
    }

    private Long playerId(Principal principal) {
        return playerService.getByUsername(principal.getName()).getId();
    }
}

