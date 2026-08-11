package com.thesystem.controller;

import com.thesystem.entity.DeepWorkSession;
import com.thesystem.security.CurrentPlayer;
import com.thesystem.service.DeepWorkService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/deep-work")
public class DeepWorkController {

    private final DeepWorkService deepWorkService;
    private final CurrentPlayer currentPlayer;

    public DeepWorkController(DeepWorkService deepWorkService,
                              CurrentPlayer currentPlayer) {
        this.deepWorkService = deepWorkService;
        this.currentPlayer = currentPlayer;
    }

    @PostMapping("/log")
    public ResponseEntity<DeepWorkSession> logSession(Principal p,
                                                       @RequestBody DeepWorkSession input) {
        return ResponseEntity.ok(deepWorkService.logSession(currentPlayer.id(p), input));
    }

    @GetMapping("/weekly")
    public ResponseEntity<List<DeepWorkSession>> getWeekly(Principal p) {
        return ResponseEntity.ok(deepWorkService.getWeeklySessions(currentPlayer.id(p)));
    }

    @GetMapping("/history")
    public ResponseEntity<List<DeepWorkSession>> getHistory(Principal p) {
        return ResponseEntity.ok(deepWorkService.getHistory(currentPlayer.id(p)));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(Principal p) {
        return ResponseEntity.ok(deepWorkService.getStats(currentPlayer.id(p)));
    }
}
