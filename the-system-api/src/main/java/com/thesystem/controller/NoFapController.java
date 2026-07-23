package com.thesystem.controller;

import com.thesystem.dto.NoFapStatusDTO;
import com.thesystem.security.JwtService;
import com.thesystem.service.NoFapService;
import com.thesystem.service.PlayerService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    /**
     * Set the actual start date of the challenge.
     *
     * Body: { "startDate": "2026-07-18" }
     *
     * Backfills pornViewed=false entries for each day from startDate to
     * yesterday (skipping any days already logged). Returns the updated status.
     */
    @PostMapping("/set-start-date")
    public ResponseEntity<?> setStartDate(HttpServletRequest request,
                                          @RequestBody Map<String, String> body) {
        String dateStr = body.get("startDate");
        if (dateStr == null || dateStr.isBlank()) {
            return ResponseEntity.badRequest().body("startDate is required (YYYY-MM-DD)");
        }
        try {
            LocalDate startDate = LocalDate.parse(dateStr);
            return ResponseEntity.ok(noFapService.setStartDate(playerId(request), startDate));
        } catch (java.time.format.DateTimeParseException e) {
            return ResponseEntity.badRequest().body("Invalid date format. Use YYYY-MM-DD.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/urge-survived")
    public ResponseEntity<Map<String, Object>> urgeSurvived(HttpServletRequest request) {
        return ResponseEntity.ok(noFapService.urgeSurvived(playerId(request)));
    }

    private Long playerId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").replace("Bearer ", "");
        return playerService.getByUsername(jwtService.extractUsername(token)).getId();
    }
}
