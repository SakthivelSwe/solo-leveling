package com.thesystem.service;

import com.thesystem.entity.BudgetEntry;
import com.thesystem.entity.SavingsGoal;
import com.thesystem.exception.ApiException;
import com.thesystem.repository.BudgetEntryRepository;
import com.thesystem.repository.SavingsGoalRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

/**
 * Module 4 — Wealth OS: monthly budget entries and savings goals.
 * Seeds default goals for a player the first time they access the module.
 */
@Service
public class WealthService {

    private final BudgetEntryRepository budgetRepo;
    private final SavingsGoalRepository goalRepo;

    public WealthService(BudgetEntryRepository budgetRepo, SavingsGoalRepository goalRepo) {
        this.budgetRepo = budgetRepo;
        this.goalRepo = goalRepo;
    }

    // ---- Budget ----
    public BudgetEntry upsertBudget(Long playerId, BudgetEntry body) {
        BudgetEntry entry = budgetRepo
                .findByPlayerIdAndEntryMonth(playerId, body.getEntryMonth())
                .orElseGet(BudgetEntry::new);
        entry.setPlayerId(playerId);
        entry.setEntryMonth(body.getEntryMonth());
        entry.setSalary(body.getSalary());
        entry.setPgRent(body.getPgRent());
        entry.setFoodSpend(body.getFoodSpend());
        entry.setTransport(body.getTransport());
        entry.setOnlineOrders(body.getOnlineOrders());
        entry.setMisc(body.getMisc());
        entry.setSaved(body.getSaved());
        entry.setSipAmount(body.getSipAmount());
        entry.setNotes(body.getNotes());
        return budgetRepo.save(entry);
    }

    public List<BudgetEntry> budgets(Long playerId) {
        return budgetRepo.findByPlayerIdOrderByEntryMonthDesc(playerId);
    }

    // ---- Savings goals ----
    public List<SavingsGoal> goals(Long playerId) {
        if (goalRepo.countByPlayerId(playerId) == 0) {
            seedDefaultGoals(playerId);
        }
        return goalRepo.findByPlayerIdOrderByDeadlineAsc(playerId);
    }

    public SavingsGoal createGoal(Long playerId, SavingsGoal body) {
        body.setId(null);
        body.setPlayerId(playerId);
        return goalRepo.save(body);
    }

    public SavingsGoal updateGoalProgress(Long playerId, Long id, int current) {
        SavingsGoal goal = goalRepo.findById(id)
                .orElseThrow(() -> new ApiException("Goal not found", HttpStatus.NOT_FOUND));
        if (!goal.getPlayerId().equals(playerId)) {
            throw new ApiException("Not your goal", HttpStatus.FORBIDDEN);
        }
        goal.setCurrent(current);
        goal.setAchieved(current >= goal.getTarget());
        return goalRepo.save(goal);
    }

    private void seedDefaultGoals(Long playerId) {
        LocalDate now = LocalDate.now();
        goalRepo.save(new SavingsGoal(playerId, "Emergency Fund (Month 1)", 5000, now.plusMonths(1)));
        goalRepo.save(new SavingsGoal(playerId, "Emergency Fund (Full)", 15000, now.plusMonths(3)));
        goalRepo.save(new SavingsGoal(playerId, "First SIP Investment", 500, now.plusWeeks(2)));
        goalRepo.save(new SavingsGoal(playerId, "New Tech Setup Fund", 10000, now.plusMonths(4)));
    }
}

