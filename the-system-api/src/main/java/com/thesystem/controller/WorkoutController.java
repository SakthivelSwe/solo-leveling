package com.thesystem.controller;

import com.thesystem.entity.WorkoutEntry;
import com.thesystem.security.CurrentPlayer;
import com.thesystem.service.WorkoutService;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * Phase 4 — Workout logger endpoints.
 */
@RestController
@RequestMapping("/api/v1/workout")
public class WorkoutController {

    private final WorkoutService workoutService;
    private final CurrentPlayer currentPlayer;

    public WorkoutController(WorkoutService workoutService, CurrentPlayer currentPlayer) {
        this.workoutService = workoutService;
        this.currentPlayer = currentPlayer;
    }

    @PostMapping("/log")
    public WorkoutEntry add(Principal p, @RequestBody WorkoutEntry body) {
        return workoutService.add(currentPlayer.id(p), body);
    }

    @GetMapping("/history")
    public List<WorkoutEntry> history(Principal p) {
        return workoutService.history(currentPlayer.id(p));
    }

    @DeleteMapping("/{id}")
    public void delete(Principal p, @PathVariable Long id) {
        workoutService.delete(currentPlayer.id(p), id);
    }
}

