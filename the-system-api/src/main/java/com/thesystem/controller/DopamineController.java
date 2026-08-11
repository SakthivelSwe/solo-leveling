package com.thesystem.controller;

import com.thesystem.entity.DopamineLog;
import com.thesystem.security.CurrentPlayer;
import com.thesystem.service.DopamineService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/dopamine")
public class DopamineController {

    private final DopamineService dopamineService;
    private final CurrentPlayer currentPlayer;

    public DopamineController(DopamineService dopamineService,
                              CurrentPlayer currentPlayer) {
        this.dopamineService = dopamineService;
        this.currentPlayer = currentPlayer;
    }

    @PostMapping("/log")
    public ResponseEntity<DopamineLog> logToday(Principal p,
                                                 @RequestBody DopamineLog input) {
        return ResponseEntity.ok(dopamineService.logToday(currentPlayer.id(p), input));
    }

    @GetMapping("/today")
    public ResponseEntity<Map<String, Object>> getToday(Principal p) {
        return ResponseEntity.ok(dopamineService.getTodaySummary(currentPlayer.id(p)));
    }

    @GetMapping("/history")
    public ResponseEntity<List<DopamineLog>> getHistory(Principal p,
                                                         @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(dopamineService.getHistory(currentPlayer.id(p), days));
    }
}
