package com.thesystem.controller;

import com.thesystem.entity.BudgetEntry;
import com.thesystem.entity.SavingsGoal;
import com.thesystem.security.CurrentPlayer;
import com.thesystem.service.WealthService;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/wealth")
public class WealthController {

    private final WealthService wealthService;
    private final CurrentPlayer currentPlayer;

    public WealthController(WealthService wealthService, CurrentPlayer currentPlayer) {
        this.wealthService = wealthService;
        this.currentPlayer = currentPlayer;
    }

    @PostMapping("/budget")
    public BudgetEntry upsertBudget(Principal p, @RequestBody BudgetEntry body) {
        return wealthService.upsertBudget(currentPlayer.id(p), body);
    }

    @GetMapping("/budget")
    public List<BudgetEntry> budgets(Principal p) {
        return wealthService.budgets(currentPlayer.id(p));
    }

    @GetMapping("/goals")
    public List<SavingsGoal> goals(Principal p) {
        return wealthService.goals(currentPlayer.id(p));
    }

    @PostMapping("/goals")
    public SavingsGoal createGoal(Principal p, @RequestBody SavingsGoal body) {
        return wealthService.createGoal(currentPlayer.id(p), body);
    }

    @PutMapping("/goals/{id}/progress")
    public SavingsGoal updateGoal(Principal p, @PathVariable Long id, @RequestBody Map<String, Integer> body) {
        return wealthService.updateGoalProgress(currentPlayer.id(p), id, body.getOrDefault("current", 0));
    }
}

