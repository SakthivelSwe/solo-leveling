package com.thesystem.controller;

import com.thesystem.dto.AchievementDTO;
import com.thesystem.dto.DayProgressDTO;
import com.thesystem.service.AchievementService;
import com.thesystem.service.PlayerService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
public class AchievementController {

    private final AchievementService achievementService;
    private final PlayerService playerService;

    public AchievementController(AchievementService achievementService, PlayerService playerService) {
        this.achievementService = achievementService;
        this.playerService = playerService;
    }

    @GetMapping("/api/achievements")
    public List<AchievementDTO> achievements(Principal principal) {
        Long playerId = playerService.getByUsername(principal.getName()).getId();
        return achievementService.getPlayerAchievements(playerId);
    }

    @GetMapping("/api/progress/weekly")
    public List<DayProgressDTO> weekly(Principal principal) {
        Long playerId = playerService.getByUsername(principal.getName()).getId();
        return playerService.getWeeklyProgress(playerId);
    }
}

