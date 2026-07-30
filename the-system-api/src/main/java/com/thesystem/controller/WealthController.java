package com.thesystem.controller;

import com.thesystem.entity.*;
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

    // ---- Expenses ----
    @PostMapping("/expenses")
    public ExpenseLog logExpense(Principal p, @RequestBody ExpenseLog body) {
        return wealthService.logExpense(currentPlayer.id(p), body);
    }

    @GetMapping("/expenses")
    public List<ExpenseLog> getExpenses(Principal p, 
                                        @RequestParam(required = false) String start, 
                                        @RequestParam(required = false) String end) {
        return wealthService.getExpenses(currentPlayer.id(p), start, end);
    }
    
    @GetMapping("/summary/weekly")
    public Map<String, Object> getWeeklySummary(Principal p) {
        return wealthService.getWeeklySummary(currentPlayer.id(p));
    }
    
    @GetMapping("/summary/monthly")
    public Map<String, Object> getMonthlySummary(Principal p) {
        return wealthService.getMonthlySummary(currentPlayer.id(p));
    }

    @GetMapping("/analysis")
    public Map<String, Object> getAnalysis(Principal p) {
        return wealthService.getExpenseAnalysis(currentPlayer.id(p));
    }

    @GetMapping(value = "/analysis/ai", produces = "text/plain")
    public String getAiSpendingAnalysis(Principal p) {
        return wealthService.getAiSpendingAnalysis(currentPlayer.id(p));
    }

    // ---- EMIs ----
    @PostMapping("/emi")
    public EmiEntry addEmi(Principal p, @RequestBody EmiEntry body) {
        return wealthService.addEmi(currentPlayer.id(p), body);
    }

    @GetMapping("/emi")
    public List<EmiEntry> getEmis(Principal p) {
        return wealthService.getEmis(currentPlayer.id(p));
    }

    @PutMapping("/emi/{id}/pay")
    public EmiEntry payEmi(Principal p, @PathVariable Long id) {
        return wealthService.payEmi(currentPlayer.id(p), id);
    }

    @DeleteMapping("/emi/{id}")
    public void deleteEmi(Principal p, @PathVariable Long id) {
        wealthService.deleteEmi(currentPlayer.id(p), id);
    }

    // ---- Subscriptions ----
    @PostMapping("/subscriptions")
    public SubscriptionEntry addSubscription(Principal p, @RequestBody SubscriptionEntry body) {
        return wealthService.addSubscription(currentPlayer.id(p), body);
    }

    @GetMapping("/subscriptions")
    public List<SubscriptionEntry> getSubscriptions(Principal p) {
        return wealthService.getSubscriptions(currentPlayer.id(p));
    }

    @PutMapping("/subscriptions/{id}/toggle")
    public SubscriptionEntry toggleSubscription(Principal p, @PathVariable Long id) {
        return wealthService.toggleSubscription(currentPlayer.id(p), id);
    }

    // ---- Budget ----
    @PostMapping("/budget")
    public BudgetEntry upsertBudget(Principal p, @RequestBody BudgetEntry body) {
        return wealthService.upsertBudget(currentPlayer.id(p), body);
    }

    @GetMapping("/budget")
    public List<BudgetEntry> budgets(Principal p) {
        return wealthService.budgets(currentPlayer.id(p));
    }

    // ---- Savings goals ----
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

    // ---- Net Worth & Runway ----
    @GetMapping("/net-worth")
    public List<com.thesystem.entity.NetWorthLog> getNetWorthHistory(Principal p) {
        return wealthService.getNetWorthHistory(currentPlayer.id(p));
    }

    @PostMapping("/net-worth")
    public com.thesystem.entity.NetWorthLog logNetWorth(Principal p, @RequestBody com.thesystem.entity.NetWorthLog body) {
        return wealthService.logNetWorth(currentPlayer.id(p), body);
    }
}
