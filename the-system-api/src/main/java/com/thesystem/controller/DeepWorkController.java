package com.thesystem.controller;

import com.thesystem.entity.DeepWorkSession;
import com.thesystem.security.JwtService;
import com.thesystem.service.DeepWorkService;
import com.thesystem.service.PlayerService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/deep-work")
public class DeepWorkController {

    private final DeepWorkService deepWorkService;
    private final JwtService jwtService;
    private final PlayerService playerService;

    public DeepWorkController(DeepWorkService deepWorkService,
                              JwtService jwtService,
                              PlayerService playerService) {
        this.deepWorkService = deepWorkService;
        this.jwtService = jwtService;
        this.playerService = playerService;
    }

    @PostMapping("/log")
    public ResponseEntity<DeepWorkSession> logSession(HttpServletRequest request,
                                                       @RequestBody DeepWorkSession input) {
        return ResponseEntity.ok(deepWorkService.logSession(playerId(request), input));
    }

    @GetMapping("/weekly")
    public ResponseEntity<List<DeepWorkSession>> getWeekly(HttpServletRequest request) {
        return ResponseEntity.ok(deepWorkService.getWeeklySessions(playerId(request)));
    }

    @GetMapping("/history")
    public ResponseEntity<List<DeepWorkSession>> getHistory(HttpServletRequest request) {
        return ResponseEntity.ok(deepWorkService.getHistory(playerId(request)));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(HttpServletRequest request) {
        return ResponseEntity.ok(deepWorkService.getStats(playerId(request)));
    }

    private Long playerId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").replace("Bearer ", "");
        return playerService.getByUsername(jwtService.extractUsername(token)).getId();
    }
}
