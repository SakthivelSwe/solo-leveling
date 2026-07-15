package com.thesystem.controller;

import com.thesystem.entity.DopamineLog;
import com.thesystem.security.JwtService;
import com.thesystem.service.DopamineService;
import com.thesystem.service.PlayerService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/dopamine")
public class DopamineController {

    private final DopamineService dopamineService;
    private final JwtService jwtService;
    private final PlayerService playerService;

    public DopamineController(DopamineService dopamineService,
                              JwtService jwtService,
                              PlayerService playerService) {
        this.dopamineService = dopamineService;
        this.jwtService = jwtService;
        this.playerService = playerService;
    }

    @PostMapping("/log")
    public ResponseEntity<DopamineLog> logToday(HttpServletRequest request,
                                                 @RequestBody DopamineLog input) {
        return ResponseEntity.ok(dopamineService.logToday(playerId(request), input));
    }

    @GetMapping("/today")
    public ResponseEntity<Map<String, Object>> getToday(HttpServletRequest request) {
        return ResponseEntity.ok(dopamineService.getTodaySummary(playerId(request)));
    }

    @GetMapping("/history")
    public ResponseEntity<List<DopamineLog>> getHistory(HttpServletRequest request,
                                                        @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(dopamineService.getHistory(playerId(request), days));
    }

    private Long playerId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").replace("Bearer ", "");
        return playerService.getByUsername(jwtService.extractUsername(token)).getId();
    }
}
