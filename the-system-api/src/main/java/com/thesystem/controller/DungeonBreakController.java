package com.thesystem.controller;

import com.thesystem.entity.DungeonBreak;
import com.thesystem.security.CurrentPlayer;
import com.thesystem.service.DungeonBreakService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/dungeon-breaks")
public class DungeonBreakController {

    private final DungeonBreakService breakService;
    private final CurrentPlayer currentPlayer;

    public DungeonBreakController(DungeonBreakService breakService, CurrentPlayer currentPlayer) {
        this.breakService = breakService;
        this.currentPlayer = currentPlayer;
    }

    @GetMapping("/active")
    public List<DungeonBreak> getActiveBreaks(Principal p) {
        return breakService.getActiveBreaks(currentPlayer.id(p));
    }

    @PostMapping("/spawn")
    public ResponseEntity<?> spawnBreak(Principal p) {
        DungeonBreak db = breakService.spawnRandomBreak(currentPlayer.id(p));
        if (db == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "A Dungeon Break is already active."));
        }
        return ResponseEntity.ok(db);
    }

    @PostMapping("/{breakId}/clear")
    public ResponseEntity<?> clearBreak(Principal p, @PathVariable Long breakId) {
        return ResponseEntity.ok(breakService.clearBreak(breakId, currentPlayer.id(p)));
    }
}
