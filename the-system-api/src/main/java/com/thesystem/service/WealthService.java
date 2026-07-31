package com.thesystem.service;

import com.thesystem.entity.*;
import com.thesystem.exception.ApiException;
import com.thesystem.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class WealthService {

    private final BudgetEntryRepository budgetRepo;
    private final SavingsGoalRepository goalRepo;
    private final NetWorthLogRepository netWorthRepo;
    private final PlayerConfigRepository configRepo;
    
    private final ExpenseLogRepository expenseRepo;
    private final EmiEntryRepository emiRepo;
    private final SubscriptionEntryRepository subRepo;
    private final AiProviderService aiProviderService;
    private final IncomeLogRepository incomeRepo;
    private final FinancialAssetRepository assetRepo;
    private final PlayerRepository playerRepo;

    public WealthService(BudgetEntryRepository budgetRepo, 
                         SavingsGoalRepository goalRepo, 
                         NetWorthLogRepository netWorthRepo, 
                         PlayerConfigRepository configRepo,
                         ExpenseLogRepository expenseRepo,
                         EmiEntryRepository emiRepo,
                         SubscriptionEntryRepository subRepo,
                         AiProviderService aiProviderService,
                         IncomeLogRepository incomeRepo,
                         FinancialAssetRepository assetRepo,
                         PlayerRepository playerRepo) {
        this.budgetRepo = budgetRepo;
        this.goalRepo = goalRepo;
        this.netWorthRepo = netWorthRepo;
        this.configRepo = configRepo;
        this.expenseRepo = expenseRepo;
        this.emiRepo = emiRepo;
        this.subRepo = subRepo;
        this.aiProviderService = aiProviderService;
        this.incomeRepo = incomeRepo;
        this.assetRepo = assetRepo;
        this.playerRepo = playerRepo;
    }

    // ---- Income ----
    public IncomeLog logIncome(Long playerId, IncomeLog body) {
        body.setId(null);
        body.setPlayerId(playerId);
        if (body.getIncomeDate() == null) body.setIncomeDate(LocalDate.now());
        return incomeRepo.save(body);
    }

    public List<IncomeLog> getIncomeHistory(Long playerId, String start, String end) {
        if (start != null && end != null) {
            return incomeRepo.findByPlayerIdAndIncomeDateBetweenOrderByIncomeDateDesc(playerId, LocalDate.parse(start), LocalDate.parse(end));
        }
        return incomeRepo.findTop20ByPlayerIdOrderByIncomeDateDesc(playerId);
    }

    // ---- Expenses ----
    public ExpenseLog logExpense(Long playerId, ExpenseLog body) {
        body.setId(null);
        body.setPlayerId(playerId);
        if (body.getExpenseDate() == null) body.setExpenseDate(LocalDate.now());
        return expenseRepo.save(body);
    }

    public List<ExpenseLog> getExpenses(Long playerId, String start, String end) {
        if (start != null && end != null) {
            return expenseRepo.findByPlayerIdAndExpenseDateBetweenOrderByExpenseDateDesc(playerId, LocalDate.parse(start), LocalDate.parse(end));
        }
        return expenseRepo.findTop20ByPlayerIdOrderByExpenseDateDesc(playerId);
    }
    
    public Map<String, Object> getWeeklySummary(Long playerId) {
        LocalDate today = LocalDate.now();
        LocalDate startOfWeek = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate endOfWeek = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
        
        LocalDate startOfLastWeek = startOfWeek.minusWeeks(1);
        LocalDate endOfLastWeek = endOfWeek.minusWeeks(1);
        
        double thisWeekTotal = expenseRepo.sumAmountByPlayerIdAndDateRange(playerId, startOfWeek, endOfWeek);
        double lastWeekTotal = expenseRepo.sumAmountByPlayerIdAndDateRange(playerId, startOfLastWeek, endOfLastWeek);
        
        List<Object[]> categoryBreakdown = expenseRepo.sumByCategoryAndDateRange(playerId, startOfWeek, endOfWeek);
        Map<String, Double> categories = new HashMap<>();
        String topCategory = "None";
        double maxCat = 0;
        for (Object[] row : categoryBreakdown) {
            String cat = (String) row[0];
            double amount = ((Number) row[1]).doubleValue();
            categories.put(cat, amount);
            if (amount > maxCat) {
                maxCat = amount;
                topCategory = cat;
            }
        }
        
        double changePercent = 0;
        if (lastWeekTotal > 0) {
            changePercent = ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100;
        }
        
        int daysPassed = today.getDayOfWeek().getValue(); // 1 to 7
        double dailyAvg = thisWeekTotal / daysPassed;
        
        return Map.of(
            "totalSpent", thisWeekTotal,
            "categoryBreakdown", categories,
            "lastWeekTotal", lastWeekTotal,
            "changePercent", changePercent,
            "dailyAverage", dailyAvg,
            "topCategory", topCategory
        );
    }
    
    public Map<String, Object> getMonthlySummary(Long playerId) {
        LocalDate today = LocalDate.now();
        LocalDate startOfMonth = today.withDayOfMonth(1);
        LocalDate endOfMonth = today.withDayOfMonth(today.lengthOfMonth());
        
        double totalExpenses = expenseRepo.sumAmountByPlayerIdAndDateRange(playerId, startOfMonth, endOfMonth);
        double totalNeeds = expenseRepo.sumEssentialByDateRange(playerId, startOfMonth, endOfMonth);
        double totalWants = expenseRepo.sumNonEssentialByDateRange(playerId, startOfMonth, endOfMonth);
        
        Double actualIncomeOpt = incomeRepo.sumAmountByPlayerIdAndDateRange(playerId, startOfMonth, endOfMonth);
        double totalIncome = actualIncomeOpt != null ? actualIncomeOpt : 0.0;
        
        BudgetEntry budget = budgetRepo.findByPlayerIdAndEntryMonth(playerId, today.toString().substring(0, 7)).orElse(new BudgetEntry());
        if (totalIncome == 0) {
            totalIncome = budget.getSalary(); // fallback to budget if no actual income logged
        }
        double totalSaved = budget.getSaved() + budget.getSipAmount();
        
        double emiTotal = emiRepo.sumActiveEmiAmount(playerId);
        double subTotal = subRepo.sumActiveMonthlySubscriptions(playerId);
        
        List<Object[]> categoryBreakdown = expenseRepo.sumByCategoryAndDateRange(playerId, startOfMonth, endOfMonth);
        Map<String, Double> categories = new HashMap<>();
        for (Object[] row : categoryBreakdown) {
            categories.put((String) row[0], ((Number) row[1]).doubleValue());
        }
        
        double savingsRate = totalIncome > 0 ? (totalSaved / totalIncome) * 100 : 0;
        double needsPercent = totalIncome > 0 ? ((totalNeeds + emiTotal) / totalIncome) * 100 : 0;
        double wantsPercent = totalIncome > 0 ? ((totalWants + subTotal) / totalIncome) * 100 : 0;
        
        return Map.of(
            "totalIncome", totalIncome,
            "totalExpenses", totalExpenses,
            "totalSaved", totalSaved,
            "savingsRate", savingsRate,
            "categoryBreakdown", categories,
            "needsPercent", needsPercent,
            "wantsPercent", wantsPercent,
            "savingsPercent", totalIncome > 0 ? (totalSaved / totalIncome) * 100 : 0,
            "emiTotal", emiTotal,
            "subscriptionTotal", subTotal
        );
    }
    
    public Map<String, Object> getExpenseAnalysis(Long playerId) {
        return getMonthlySummary(playerId);
    }

    public String getAiSpendingAnalysis(Long playerId) {
        LocalDate today = LocalDate.now();
        LocalDate startOfMonth = today.withDayOfMonth(1);
        List<ExpenseLog> expenses = expenseRepo.findByPlayerIdAndExpenseDateBetweenOrderByExpenseDateDesc(playerId, startOfMonth, today);
        
        if (expenses.isEmpty()) {
            return "Not enough data to analyze yet. Keep logging your expenses!";
        }
        
        StringBuilder prompt = new StringBuilder("Analyze the following expenses for this month and identify unwanted or impulse spending. Give actionable, concise advice (under 150 words). Categorize severity as GOOD, CAUTION, or OVERSPEND:\n");
        for (ExpenseLog e : expenses) {
            prompt.append("- ").append(e.getCategory()).append(" | ").append(e.getDescription()).append(" | ₹").append(e.getAmount()).append("\n");
        }
        
        try {
            return aiProviderService.generate(AiProviderService.Scenario.COACHING, 
                "You are a strict, no-nonsense financial advisor (like a Drill Sergeant).", 
                prompt.toString());
        } catch (Exception e) {
            return "AI analysis unavailable. Watch your 'Wants' category carefully based on recent trends.";
        }
    }
    
    // ---- EMIs ----
    public EmiEntry addEmi(Long playerId, EmiEntry body) {
        body.setId(null);
        body.setPlayerId(playerId);
        if (body.getStartDate() == null) body.setStartDate(LocalDate.now());
        body.setRemainingAmount(body.getPrincipalAmount());
        return emiRepo.save(body);
    }
    
    public List<EmiEntry> getEmis(Long playerId) {
        return emiRepo.findByPlayerIdOrderByNextDueDateAsc(playerId);
    }
    
    public EmiEntry payEmi(Long playerId, Long emiId) {
        EmiEntry emi = emiRepo.findById(emiId)
            .orElseThrow(() -> new ApiException("EMI not found", HttpStatus.NOT_FOUND));
        if (!emi.getPlayerId().equals(playerId)) throw new ApiException("Not your EMI", HttpStatus.FORBIDDEN);
        
        emi.setTotalPaid(emi.getTotalPaid() + emi.getEmiAmount());
        emi.setRemainingAmount(Math.max(0, emi.getRemainingAmount() - emi.getEmiAmount()));
        if (emi.getRemainingAmount() <= 0) {
            emi.setStatus("COMPLETED");
        }
        if (emi.getNextDueDate() != null) {
            emi.setNextDueDate(emi.getNextDueDate().plusMonths(1));
        }
        return emiRepo.save(emi);
    }
    
    public void deleteEmi(Long playerId, Long emiId) {
        EmiEntry emi = emiRepo.findById(emiId)
            .orElseThrow(() -> new ApiException("EMI not found", HttpStatus.NOT_FOUND));
        if (!emi.getPlayerId().equals(playerId)) throw new ApiException("Not your EMI", HttpStatus.FORBIDDEN);
        emiRepo.delete(emi);
    }

    // ---- Subscriptions ----
    public SubscriptionEntry addSubscription(Long playerId, SubscriptionEntry body) {
        body.setId(null);
        body.setPlayerId(playerId);
        return subRepo.save(body);
    }
    
    public List<SubscriptionEntry> getSubscriptions(Long playerId) {
        return subRepo.findByPlayerIdOrderByNextBillingDateAsc(playerId);
    }
    
    public SubscriptionEntry toggleSubscription(Long playerId, Long subId) {
        SubscriptionEntry sub = subRepo.findById(subId)
            .orElseThrow(() -> new ApiException("Subscription not found", HttpStatus.NOT_FOUND));
        if (!sub.getPlayerId().equals(playerId)) throw new ApiException("Not yours", HttpStatus.FORBIDDEN);
        sub.setActive(!sub.isActive());
        return subRepo.save(sub);
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

    // ---- Net Worth & Runway ----
    public NetWorthLog logNetWorth(Long playerId, NetWorthLog body) {
        body.setId(null);
        body.setPlayerId(playerId);
        body.setLogDate(LocalDate.now());
        body.setNetWorth(body.getTotalAssets() - body.getTotalLiabilities());
        
        PlayerConfig config = configRepo.findByPlayerId(playerId).orElse(null);
        if (config != null && config.getMonthlyBaselineExpenses() > 0) {
            body.setCashRunwayMonths(body.getTotalAssets() / config.getMonthlyBaselineExpenses());
        } else {
            body.setCashRunwayMonths(body.getTotalAssets() / 50000.0); // Default 50k
        }
        
        return netWorthRepo.save(body);
    }

    public List<NetWorthLog> getNetWorthHistory(Long playerId) {
        return netWorthRepo.findAllByPlayerIdOrderByLogDateDesc(playerId);
    }

    public List<FinancialAsset> getAssets(Long playerId) {
        return assetRepo.findByPlayerId(playerId);
    }

    public FinancialAsset buyAsset(Long playerId, String name, String type, int shares, int costPerShare, int yieldPerShare) {
        Player p = playerRepo.findById(playerId).orElseThrow();
        int totalCost = shares * costPerShare;
        if (p.getSystemGold() < totalCost) throw new ApiException("Not enough System Gold", HttpStatus.BAD_REQUEST);
        
        p.setSystemGold(p.getSystemGold() - totalCost);
        playerRepo.save(p);

        FinancialAsset a = new FinancialAsset();
        a.setPlayerId(playerId);
        a.setName(name);
        a.setType(type);
        a.setShares(shares);
        a.setCost(costPerShare);
        a.setDailyGoldYield(yieldPerShare);
        return assetRepo.save(a);
    }
}
