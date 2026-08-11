package com.thesystem.controller;

import com.thesystem.dto.DailyMissionDTO;
import com.thesystem.security.CurrentPlayer;
import com.thesystem.service.DailyMissionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/daily-mission")
public class DailyMissionController {

    private final DailyMissionService missionService;
    private final CurrentPlayer currentPlayer;

    public DailyMissionController(DailyMissionService missionService,
                                  CurrentPlayer currentPlayer) {
        this.missionService = missionService;
        this.currentPlayer = currentPlayer;
    }

    /** GET today's 5+3 mission set. Generates it if not yet created today. */
    @GetMapping
    public ResponseEntity<DailyMissionDTO> getTodayMissions(Principal p) {
        return ResponseEntity.ok(missionService.getTodayMissions(currentPlayer.id(p)));
    }

    /** POST to force-regenerate today's mission set (once per day). */
    @PostMapping("/regenerate")
    public ResponseEntity<DailyMissionDTO> regenerate(Principal p) {
        return ResponseEntity.ok(missionService.regenerate(currentPlayer.id(p)));
    }
}
