package com.thesystem.controller;

import com.thesystem.dto.DailyMissionDTO;
import com.thesystem.security.JwtService;
import com.thesystem.service.DailyMissionService;
import com.thesystem.service.PlayerService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/daily-mission")
public class DailyMissionController {

    private final DailyMissionService missionService;
    private final JwtService jwtService;
    private final PlayerService playerService;

    public DailyMissionController(DailyMissionService missionService,
                                  JwtService jwtService,
                                  PlayerService playerService) {
        this.missionService = missionService;
        this.jwtService = jwtService;
        this.playerService = playerService;
    }

    /** GET today's 5+3 mission set. Generates it if not yet created today. */
    @GetMapping
    public ResponseEntity<DailyMissionDTO> getTodayMissions(HttpServletRequest request) {
        Long playerId = playerId(request);
        return ResponseEntity.ok(missionService.getTodayMissions(playerId));
    }

    /** POST to force-regenerate today's mission set (once per day). */
    @PostMapping("/regenerate")
    public ResponseEntity<DailyMissionDTO> regenerate(HttpServletRequest request) {
        Long playerId = playerId(request);
        return ResponseEntity.ok(missionService.regenerate(playerId));
    }

    private Long playerId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").replace("Bearer ", "");
        String username = jwtService.extractUsername(token);
        return playerService.getByUsername(username).getId();
    }
}
