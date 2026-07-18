package com.thesystem.controller;

import com.thesystem.entity.MindLog;
import com.thesystem.entity.SelfDoubtEvidence;
import com.thesystem.dto.MoodPointDTO;
import com.thesystem.security.CurrentPlayer;
import com.thesystem.service.MindService;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/mind")
public class MindController {

    private final MindService mindService;
    private final CurrentPlayer currentPlayer;

    public MindController(MindService mindService, CurrentPlayer currentPlayer) {
        this.mindService = mindService;
        this.currentPlayer = currentPlayer;
    }

    @PostMapping("/log")
    public MindLog upsert(Principal p, @RequestBody MindLog body) {
        return mindService.upsert(currentPlayer.id(p), body);
    }

    @GetMapping("/today")
    public MindLog today(Principal p) {
        return mindService.today(currentPlayer.id(p));
    }

    @GetMapping("/history")
    public List<MindLog> history(Principal p) {
        return mindService.history(currentPlayer.id(p));
    }

    @PostMapping("/evidence")
    public SelfDoubtEvidence addEvidence(Principal p, @RequestBody Map<String, String> body) {
        return mindService.addEvidence(currentPlayer.id(p),
                body.get("evidence"), body.getOrDefault("category", "CHARACTER"));
    }

    @GetMapping("/evidence")
    public List<SelfDoubtEvidence> evidence(Principal p) {
        return mindService.evidence(currentPlayer.id(p));
    }

    /* ===== Phase 2 — Mood Trend Graph ===== */

    @GetMapping("/mood-trend")
    public List<MoodPointDTO> moodTrend(Principal p, @RequestParam(defaultValue = "30") int days) {
        return mindService.moodTrend(currentPlayer.id(p), days);
    }
}

