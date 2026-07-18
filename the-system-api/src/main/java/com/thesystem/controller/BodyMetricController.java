package com.thesystem.controller;

import com.thesystem.entity.BodyMetric;
import com.thesystem.security.CurrentPlayer;
import com.thesystem.service.BodyMetricService;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * Phase 2 — Body Metrics tracker: daily weight + body-fat %.
 * Kept on its own path (`/api/body-metrics`) so it doesn't collide with the
 * existing Body OS testosterone-pillar endpoints at `/api/body`.
 */
@RestController
@RequestMapping("/api/v1/body-metrics")
public class BodyMetricController {

    private final BodyMetricService bodyMetricService;
    private final CurrentPlayer currentPlayer;

    public BodyMetricController(BodyMetricService bodyMetricService, CurrentPlayer currentPlayer) {
        this.bodyMetricService = bodyMetricService;
        this.currentPlayer = currentPlayer;
    }

    @PostMapping("/log")
    public BodyMetric upsert(Principal p, @RequestBody BodyMetric body) {
        return bodyMetricService.upsert(currentPlayer.id(p), body);
    }

    @GetMapping("/today")
    public BodyMetric today(Principal p) {
        return bodyMetricService.today(currentPlayer.id(p));
    }

    @GetMapping("/history")
    public List<BodyMetric> history(Principal p) {
        return bodyMetricService.history(currentPlayer.id(p));
    }
}

