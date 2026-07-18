package com.thesystem.controller;

import com.thesystem.entity.DietEntry;
import com.thesystem.entity.ExerciseLog;
import com.thesystem.entity.HealthLog;
import com.thesystem.dto.SleepEntryDTO;
import com.thesystem.security.CurrentPlayer;
import com.thesystem.service.HealthService;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    private final HealthService healthService;
    private final CurrentPlayer currentPlayer;

    public HealthController(HealthService healthService, CurrentPlayer currentPlayer) {
        this.healthService = healthService;
        this.currentPlayer = currentPlayer;
    }

    @PostMapping("/log")
    public HealthLog upsert(Principal p, @RequestBody HealthLog body) {
        return healthService.upsertHealth(currentPlayer.id(p), body);
    }

    @GetMapping("/today")
    public HealthLog today(Principal p) {
        return healthService.today(currentPlayer.id(p));
    }

    @GetMapping("/history")
    public List<HealthLog> history(Principal p) {
        return healthService.healthHistory(currentPlayer.id(p));
    }

    @PostMapping("/water")
    public HealthLog water(Principal p, @RequestBody Map<String, Integer> body) {
        return healthService.logWater(currentPlayer.id(p), body.getOrDefault("glasses", 0));
    }

    @PostMapping("/exercise")
    public ExerciseLog logExercise(Principal p, @RequestBody ExerciseLog body) {
        return healthService.logExercise(currentPlayer.id(p), body);
    }

    @GetMapping("/exercise")
    public List<ExerciseLog> exercise(Principal p) {
        return healthService.exerciseHistory(currentPlayer.id(p));
    }

    /* ===== Phase 2 — Dedicated Sleep Tracker ===== */

    @PostMapping("/sleep")
    public HealthLog logSleep(Principal p, @RequestBody Map<String, String> body) {
        Integer quality = body.get("quality") != null && !body.get("quality").isBlank()
                ? Integer.valueOf(body.get("quality")) : null;
        return healthService.upsertSleep(
                currentPlayer.id(p),
                body.get("date"),
                body.get("bedtime"),
                body.get("wakeTime"),
                quality);
    }

    @GetMapping("/sleep/history")
    public List<SleepEntryDTO> sleepHistory(Principal p) {
        return healthService.sleepHistory(currentPlayer.id(p));
    }

    // Diet / Nutrition
    @PostMapping("/diet")
    public DietEntry logDiet(Principal p, @RequestBody DietEntry body) {
        return healthService.logDiet(currentPlayer.id(p), body);
    }

    @GetMapping("/diet/history")
    public List<DietEntry> dietHistory(Principal p) {
        return healthService.dietHistory(currentPlayer.id(p));
    }

    @GetMapping("/diet/ai-report")
    public String generateWeeklyHealthReport(Principal p) {
        return healthService.generateWeeklyHealthReport(currentPlayer.id(p));
    }
}
