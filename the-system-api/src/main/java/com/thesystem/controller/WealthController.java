package com.thesystem.controller;

import com.thesystem.entity.*;
import com.thesystem.dto.StatementParseResponse;
import com.thesystem.security.CurrentPlayer;
import com.thesystem.service.StatementParserService;
import com.thesystem.service.WealthService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/wealth")
public class WealthController {

    private final WealthService wealthService;
    private final StatementParserService statementParserService;
    private final CurrentPlayer currentPlayer;

    public WealthController(WealthService wealthService, StatementParserService statementParserService, CurrentPlayer currentPlayer) {
        this.wealthService = wealthService;
        this.statementParserService = statementParserService;
        this.currentPlayer = currentPlayer;
    }

    // ---- Income ----
    @PostMapping("/income")
    public IncomeLog logIncome(Principal p, @RequestBody IncomeLog body) {
        return wealthService.logIncome(currentPlayer.id(p), body);
    }

    @GetMapping("/income")
    public List<IncomeLog> getIncomeHistory(Principal p, 
                                            @RequestParam(required = false) String start, 
                                            @RequestParam(required = false) String end) {
        return wealthService.getIncomeHistory(currentPlayer.id(p), start, end);
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
    // ---- Financial Assets ----
    @GetMapping("/assets")
    public List<com.thesystem.entity.FinancialAsset> getAssets(Principal p) {
        return wealthService.getAssets(currentPlayer.id(p));
    }

    @PostMapping("/assets/buy")
    public com.thesystem.entity.FinancialAsset buyAsset(Principal p, @RequestBody Map<String, Object> req) {
        String name = (String) req.getOrDefault("name", "Unknown Asset");
        String type = (String) req.getOrDefault("type", "INDEX_FUND");
        int shares = req.containsKey("shares") ? ((Number) req.get("shares")).intValue() : 1;
        int cost = req.containsKey("cost") ? ((Number) req.get("cost")).intValue() : 0;
        int yield = req.containsKey("yield") ? ((Number) req.get("yield")).intValue() : 0;
        
        return wealthService.buyAsset(
            currentPlayer.id(p),
            name,
            type,
            shares,
            cost,
            yield
        );
    }

    // ---- Chit Funds ----
    @GetMapping("/chit")
    public List<ChitFund> getChitFunds(Principal p) {
        return wealthService.getChitFunds(currentPlayer.id(p));
    }

    @PostMapping("/chit")
    public ChitFund createChitFund(Principal p, @RequestBody ChitFund body) {
        return wealthService.createChitFund(currentPlayer.id(p), body);
    }

    @PutMapping("/chit/{id}/pay")
    public ChitFund payChitInstallment(Principal p, @PathVariable Long id) {
        return wealthService.payChitInstallment(currentPlayer.id(p), id);
    }

    @PutMapping("/chit/{id}/claim")
    public ChitFund claimChitPrize(Principal p, @PathVariable Long id, @RequestBody Map<String, Double> body) {
        double prizeAmount = body.getOrDefault("prizeAmount", 0.0);
        double discountAmount = body.getOrDefault("discountAmount", 0.0);
        return wealthService.claimChitPrize(currentPlayer.id(p), id, prizeAmount, discountAmount);
    }

    @DeleteMapping("/chit/{id}")
    public void deleteChitFund(Principal p, @PathVariable Long id) {
        wealthService.deleteChitFund(currentPlayer.id(p), id);
    }

    // ---- Bank Statement AI Classifier ----
    @PostMapping("/statement/classify")
    public List<String> classifyTransactions(Principal p, @RequestBody Map<String, List<String>> body) {
        List<String> particulars = body.getOrDefault("particulars", List.of());
        return wealthService.classifyTransactionDescriptions(particulars);
    }

    @PostMapping("/statement/parse-pdf")
    public org.springframework.http.ResponseEntity<?> parsePdfStatement(Principal p, @RequestParam("file") MultipartFile file) {
        // SEC FIX: Enforce authentication — prevents anonymous DoS via large file uploads
        currentPlayer.id(p);
        try {
            StatementParseResponse result = statementParserService.parseAxisBankPdf(file);
            if (result.getRows() == null || result.getRows().isEmpty()) {
                return org.springframework.http.ResponseEntity.ok(result); // return empty but not an error
            }
            return org.springframework.http.ResponseEntity.ok(result);
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(WealthController.class)
                .error("PDF parse error for file '{}': {}", file.getOriginalFilename(), e.getMessage(), e);
            return org.springframework.http.ResponseEntity
                .status(org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY)
                .body(java.util.Map.of(
                    "error", "PDF parsing failed: " + e.getMessage(),
                    "hint", "Ensure this is a valid Axis Bank PDF statement"
                ));
        }
    }

    // ---- Statement History ----
    @PostMapping("/statements/save")
    public BankStatementRecord saveStatement(Principal p, @RequestParam("fileName") String fileName, @RequestBody StatementParseResponse parsed) {
        return wealthService.saveStatement(currentPlayer.id(p), parsed, fileName);
    }

    @GetMapping("/statements")
    public List<BankStatementRecord> getStatements(Principal p) {
        return wealthService.getStatementHistory(currentPlayer.id(p));
    }

    @GetMapping("/statements/{id}")
    public java.util.Map<String, Object> getStatement(Principal p, @PathVariable Long id) {
        BankStatementRecord record = wealthService.getStatement(currentPlayer.id(p), id);
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("id", record.getId());
        result.put("fileName", record.getFileName());
        result.put("bankName", record.getBankName());
        result.put("period", record.getPeriod());
        result.put("accountHolder", record.getAccountHolder());
        result.put("uploadDate", record.getUploadDate());
        result.put("openingBalance", record.getOpeningBalance());
        result.put("transactions", record.getTransactions());
        return result;
    }

    @DeleteMapping("/statements/{id}")
    public void deleteStatement(Principal p, @PathVariable Long id) {
        wealthService.deleteStatement(currentPlayer.id(p), id);
    }

    // ---- Phase 2A: Recurring Expense Detection ----

    /**
     * GET /api/v1/wealth/recurring
     * Returns detected recurring expense patterns from the last 90 days.
     * Patterns qualify if they appear 3+ times with amount variance ≤ 40%.
     */
    @GetMapping("/recurring")
    public List<com.thesystem.dto.RecurringExpenseDTO> getRecurringExpenses(Principal p) {
        return wealthService.detectRecurringExpenses(currentPlayer.id(p));
    }
}
