package com.thesystem.controller;

import com.thesystem.dto.NoFapStatusDTO;
import com.thesystem.exception.ApiException;
import com.thesystem.security.CurrentPlayer;
import com.thesystem.service.NoFapService;
import com.thesystem.service.PlayerService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.util.Map;

/**
 * No Fap Challenge REST Controller.
 *
 * All endpoints are JWT-protected (standard project pattern).
 * Reuses existing dopamine_logs table via NoFapService.
 *
 * Endpoints:
 *   GET  /api/v1/nofap/status           — full status DTO
 *   POST /api/v1/nofap/confirm-clean    — mark today as clean
 *   POST /api/v1/nofap/relapse          — honest relapse report
 *   POST /api/v1/nofap/set-start-date   — backfill clean days from a past start date
 */
@RestController
@RequestMapping("/api/v1/nofap")
public class NoFapController {

    private final NoFapService noFapService;
    private final PlayerService playerService;
    private final CurrentPlayer currentPlayer;

    public NoFapController(NoFapService noFapService,
                           PlayerService playerService,
                           CurrentPlayer currentPlayer) {
        this.noFapService = noFapService;
        this.playerService = playerService;
        this.currentPlayer = currentPlayer;
    }

    @GetMapping("/status")
    public ResponseEntity<NoFapStatusDTO> getStatus(Principal p) {
        return ResponseEntity.ok(noFapService.getStatus(playerId(p)));
    }

    @PostMapping("/confirm-clean")
    public ResponseEntity<NoFapStatusDTO> confirmClean(Principal p) {
        return ResponseEntity.ok(noFapService.confirmCleanDay(playerId(p)));
    }

    @PostMapping("/relapse")
    public ResponseEntity<NoFapStatusDTO> relapse(Principal p) {
        return ResponseEntity.ok(noFapService.reportRelapse(playerId(p)));
    }

    /**
     * Set the actual start date of the challenge.
     *
     * Body: { "startDate": "2026-07-18" }
     *
     * Backfills pornViewed=false entries for each day from startDate to
     * yesterday (skipping any days already logged). Returns the updated status.
     */
    @PostMapping("/set-start-date")
    public ResponseEntity<?> setStartDate(Principal p,
                                          @RequestBody Map<String, String> body) {
        String dateStr = body.get("startDate");
        if (dateStr == null || dateStr.isBlank()) {
            return ResponseEntity.badRequest().body("startDate is required (YYYY-MM-DD)");
        }
        try {
            LocalDate startDate = LocalDate.parse(dateStr);
            return ResponseEntity.ok(noFapService.setStartDate(playerId(p), startDate));
        } catch (java.time.format.DateTimeParseException e) {
            return ResponseEntity.badRequest().body("Invalid date format. Use YYYY-MM-DD.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/nightfall")
    public ResponseEntity<Map<String, Object>> logNightfall(Principal p) {
        return ResponseEntity.ok(noFapService.logNightfall(playerId(p)));
    }

    @PostMapping("/urge-survived")
    public ResponseEntity<Map<String, Object>> urgeSurvived(Principal p) {
        return ResponseEntity.ok(noFapService.urgeSurvived(playerId(p)));
    }

    @GetMapping("/urge-truth-bomb")
    public ResponseEntity<Map<String, String>> urgeTruthBomb(Principal p) {
        String bomb = noFapService.generateUrgeTruthBomb(playerId(p));
        return ResponseEntity.ok(Map.of("truthBomb", bomb));
    }

    private Long playerId(Principal p) {
        var player = playerService.getByUsername(p.getName());
        if (!"sakthiveltony@gmail.com".equals(player.getEmail())) {
            throw new ApiException("NoFap module is strictly gated.", HttpStatus.FORBIDDEN);
        }
        return player.getId();
    }
}
