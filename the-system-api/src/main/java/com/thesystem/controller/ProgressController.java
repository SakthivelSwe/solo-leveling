package com.thesystem.controller;

import com.thesystem.dto.HeatmapDayDTO;
import com.thesystem.dto.MonthlyReportDTO;
import com.thesystem.service.PlayerService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

/**
 * Progress analytics — consistency heatmap + the monthly report card.
 * (Weekly progress lives in AchievementController for backwards-compatibility.)
 */
@RestController
@RequestMapping("/api/v1/progress")
public class ProgressController {

    private final PlayerService playerService;

    public ProgressController(PlayerService playerService) {
        this.playerService = playerService;
    }

    /** GitHub-style consistency heatmap. Default 126 days (~18 weeks). */
    @GetMapping("/heatmap")
    public List<HeatmapDayDTO> heatmap(Principal principal,
                                       @RequestParam(defaultValue = "126") int days) {
        return playerService.getHeatmap(playerId(principal), days);
    }

    /** The System's monthly report card. */
    @GetMapping("/report")
    public MonthlyReportDTO report(Principal principal) {
        return playerService.getMonthlyReport(playerId(principal));
    }

    private Long playerId(Principal principal) {
        return playerService.getByUsername(principal.getName()).getId();
    }
}

