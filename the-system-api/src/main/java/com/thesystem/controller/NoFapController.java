package com.thesystem.controller;

import com.thesystem.dto.NoFapStatusDTO;
import com.thesystem.security.JwtService;
import com.thesystem.service.NoFapService;
import com.thesystem.service.PlayerService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * No Fap Challenge REST Controller.
 *
 * All endpoints are JWT-protected (standard project pattern).
 * Reuses existing dopamine_logs table via NoFapService.
 *
 * Endpoints:
 *   GET  /api/v1/nofap/status          — full status DTO
 *   POST /api/v1/nofap/confirm-clean   — mark today as clean
 *   POST /api/v1/nofap/relapse         — honest relapse report
 */
@RestController
@RequestMapping("/api/v1/nofap")
public class NoFapController {

    private final NoFapService noFapService;
    private final JwtService jwtService;
    private final PlayerService playerService;

    public NoFapController(NoFapService noFapService,
                           JwtService jwtService,
                           PlayerService playerService) {
        this.noFapService = noFapService;
        this.jwtService = jwtService;
        this.playerService = playerService;
    }

    @GetMapping("/status")
    public ResponseEntity<NoFapStatusDTO> getStatus(HttpServletRequest request) {
        return ResponseEntity.ok(noFapService.getStatus(playerId(request)));
    }

    @PostMapping("/confirm-clean")
    public ResponseEntity<NoFapStatusDTO> confirmClean(HttpServletRequest request) {
        return ResponseEntity.ok(noFapService.confirmCleanDay(playerId(request)));
    }

    @PostMapping("/relapse")
    public ResponseEntity<NoFapStatusDTO> relapse(HttpServletRequest request) {
        return ResponseEntity.ok(noFapService.reportRelapse(playerId(request)));
    }

    private Long playerId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").replace("Bearer ", "");
        return playerService.getByUsername(jwtService.extractUsername(token)).getId();
    }
}
