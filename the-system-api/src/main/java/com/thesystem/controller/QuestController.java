package com.thesystem.controller;

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
@RequestMapping("/api/quests")
public class QuestController {

    private final QuestService questService;
    private final PlayerService playerService;
    private final QuestRepository questRepository;

    public QuestController(QuestService questService, PlayerService playerService,
                           QuestRepository questRepository) {
        this.questService = questService;
        this.playerService = playerService;
        this.questRepository = questRepository;
    }

    @GetMapping("/today")
    public List<QuestDTO> today(Principal principal) {
        return questService.getTodayQuests(playerId(principal));
    }

    @PostMapping("/{key}/complete")
    public QuestCompletionResult complete(Principal principal, @PathVariable String key) {
        return questService.completeQuest(playerId(principal), key);
    }

    @GetMapping("/history")
    public List<DayProgressDTO> history(Principal principal) {
        return playerService.getWeeklyProgress(playerId(principal));
    }

    /** Create a custom quest (from Settings Panel). */
    @PostMapping("/custom")
    public QuestDTO createCustomQuest(Principal principal, @RequestBody Map<String, Object> body) {
        String key = String.valueOf(body.getOrDefault("questKey", "CUSTOM"));
        if (questRepository.existsByQuestKey(key)) {
            key = key + "_" + System.currentTimeMillis() % 10000;
        }
        String label      = String.valueOf(body.getOrDefault("label", "[CUSTOM] Quest"));
        String catStr     = String.valueOf(body.getOrDefault("category", "DAILY"));
        int xp            = Integer.parseInt(String.valueOf(body.getOrDefault("xpReward", "60")));
        String statBoosts = body.get("statBoosts") != null ? String.valueOf(body.get("statBoosts")) : null;

        QuestCategory cat;
        try { cat = QuestCategory.valueOf(catStr); }
        catch (IllegalArgumentException e) { cat = QuestCategory.DAILY; }

        Quest q = new Quest(key, label, cat, xp, statBoosts, null);
        q = questRepository.save(q);
        return questService.toDto(q, false);
    }

    /** Toggle a quest's active flag. */
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



