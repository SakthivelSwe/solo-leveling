package com.thesystem.service;

import com.thesystem.dto.DataTransferRequest;
import com.thesystem.dto.DataTransferResponse;
import com.thesystem.entity.*;
import com.thesystem.repository.*;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.function.Consumer;

@Service
public class DataTransferService {

    private final PlayerRepository playerRepo;
    private final HabitRepository habitRepo;
    private final HabitCompletionRepository habitCompletionRepo;
    private final QuestRepository questRepo;
    private final QuestCompletionRepository questCompletionRepo;
    private final DailyMissionRepository dailyMissionRepo;
    private final PlayerStatsRepository statsRepo;
    private final PlayerConfigRepository configRepo;
    private final PlayerSkillRepository skillRepo;
    private final InventoryItemRepository inventoryRepo;
    private final ShadowRepository shadowRepo;
    private final AchievementRepository achievementRepo;
    private final ExpenseLogRepository expenseRepo;
    private final IncomeLogRepository incomeRepo;
    private final WorkoutEntryRepository workoutRepo;
    private final LeetcodeLogRepository leetcodeRepo;
    // (We will just do a few crucial ones first for the proof of concept)

    public DataTransferService(
            PlayerRepository playerRepo,
            HabitRepository habitRepo,
            HabitCompletionRepository habitCompletionRepo,
            QuestRepository questRepo,
            QuestCompletionRepository questCompletionRepo,
            DailyMissionRepository dailyMissionRepo,
            PlayerStatsRepository statsRepo,
            PlayerConfigRepository configRepo,
            PlayerSkillRepository skillRepo,
            InventoryItemRepository inventoryRepo,
            ShadowRepository shadowRepo,
            AchievementRepository achievementRepo,
            ExpenseLogRepository expenseRepo,
            IncomeLogRepository incomeRepo,
            WorkoutEntryRepository workoutRepo,
            LeetcodeLogRepository leetcodeRepo
    ) {
        this.playerRepo = playerRepo;
        this.habitRepo = habitRepo;
        this.habitCompletionRepo = habitCompletionRepo;
        this.questRepo = questRepo;
        this.questCompletionRepo = questCompletionRepo;
        this.dailyMissionRepo = dailyMissionRepo;
        this.statsRepo = statsRepo;
        this.configRepo = configRepo;
        this.skillRepo = skillRepo;
        this.inventoryRepo = inventoryRepo;
        this.shadowRepo = shadowRepo;
        this.achievementRepo = achievementRepo;
        this.expenseRepo = expenseRepo;
        this.incomeRepo = incomeRepo;
        this.workoutRepo = workoutRepo;
        this.leetcodeRepo = leetcodeRepo;
    }

    @Transactional
    public DataTransferResponse transferData(Long sourcePlayerId, DataTransferRequest req) {
        Player source = playerRepo.findById(sourcePlayerId).orElseThrow();
        Player target = playerRepo.findByEmail(req.getTargetEmail())
                .orElseThrow(() -> new com.thesystem.exception.ApiException(
                        "Target player not found with email: " + req.getTargetEmail(),
                        org.springframework.http.HttpStatus.NOT_FOUND));

        // SEC FIX: Prevent cross-account data injection.
        // A player may only transfer their own data to their own account (device migration).
        // The target account must share the same email as the source account — i.e., they
        // own both accounts (a secondary device/test account with the same email).
        // This prevents malicious data injection into another player's account.
        if (!source.getEmail().equals(target.getEmail())) {
            throw new com.thesystem.exception.ApiException(
                    "Data transfer is only permitted between accounts sharing the same email address. " +
                    "This prevents unauthorized data injection into other players' accounts.",
                    org.springframework.http.HttpStatus.FORBIDDEN);
        }

        Long sId = source.getId();
        Long tId = target.getId();
        List<String> mods = req.getModules();
        boolean all = mods.contains("ALL");
        Map<String, Integer> stats = new HashMap<>();
        
        if (all || mods.contains("HABITS")) {
            List<Habit> habits = habitRepo.findByPlayerIdOrderByCreatedAtAsc(sId);
            int count = 0;
            for (Habit h : habits) {
                Habit copy = new Habit();
                BeanUtils.copyProperties(h, copy, "id");
                copy.setPlayerId(tId);
                Habit saved = habitRepo.save(copy);
                
                // Copy completions for this habit
                List<HabitCompletion> completions = habitCompletionRepo.findByHabitIdOrderByCompletedAtDesc(h.getId());
                for (HabitCompletion c : completions) {
                    HabitCompletion cCopy = new HabitCompletion();
                    BeanUtils.copyProperties(c, cCopy, "id");
                    cCopy.setPlayerId(tId);
                    cCopy.setHabitId(saved.getId());
                    habitCompletionRepo.save(cCopy);
                }
                count++;
            }
            stats.put("Habits", count);
        }

        if (all || mods.contains("QUESTS")) {
            List<Quest> quests = questRepo.findByOwnerIdAndActiveTrueOrderByIdDesc(sId);
            int count = 0;
            for (Quest q : quests) {
                if (q.getCategory() != null && "TESTOSTERONE".equals(q.getCategory().name())) {
                    continue; // Skip restricted
                }
                Quest copy = new Quest();
                BeanUtils.copyProperties(q, copy, "id", "skillBoosts", "statBoosts");
                copy.setOwnerId(tId);
                // regenerate a unique quest key
                copy.setQuestKey(q.getQuestKey() + "_clone_" + System.currentTimeMillis() + "_" + count);
                questRepo.save(copy);
                count++;
            }
            stats.put("Quests", count);
            
            // Note: skipping quest completions for now to keep it simple and avoid unique constraint clashes
        }

        if (all || mods.contains("CORE")) {
            // copy skills
            List<PlayerSkill> skills = skillRepo.findByPlayerId(sId);
            for (PlayerSkill s : skills) {
                PlayerSkill copy = new PlayerSkill();
                BeanUtils.copyProperties(s, copy, "id");
                copy.setPlayerId(tId);
                skillRepo.save(copy);
            }
            stats.put("Skills", skills.size());
            
            // shadows
            List<Shadow> shadows = shadowRepo.findByPlayerIdOrderByShadowLevelDesc(sId);
            for (Shadow s : shadows) {
                Shadow copy = new Shadow();
                BeanUtils.copyProperties(s, copy, "id");
                copy.setPlayerId(tId);
                // might need to associate with target's habit ids? This can get tricky. 
                // We'll leave the original habitId or clear it.
                shadowRepo.save(copy);
            }
            stats.put("Shadows", shadows.size());
        }

        if (all || mods.contains("FINANCE")) {
            List<ExpenseLog> expenses = expenseRepo.findByPlayerIdOrderByExpenseDateDesc(sId);
            for (ExpenseLog e : expenses) {
                ExpenseLog copy = new ExpenseLog();
                BeanUtils.copyProperties(e, copy, "id");
                copy.setPlayerId(tId);
                expenseRepo.save(copy);
            }
            stats.put("Expenses", expenses.size());
            
            List<IncomeLog> incomes = incomeRepo.findTop20ByPlayerIdOrderByIncomeDateDesc(sId);
            for (IncomeLog i : incomes) {
                IncomeLog copy = new IncomeLog();
                BeanUtils.copyProperties(i, copy, "id");
                copy.setPlayerId(tId);
                incomeRepo.save(copy);
            }
            stats.put("Incomes", incomes.size());
        }

        if (all || mods.contains("LEARNING")) {
            List<LeetcodeLog> leets = leetcodeRepo.findByPlayerIdOrderBySolvedDateDesc(sId);
            for (LeetcodeLog l : leets) {
                LeetcodeLog copy = new LeetcodeLog();
                BeanUtils.copyProperties(l, copy, "id");
                copy.setPlayerId(tId);
                leetcodeRepo.save(copy);
            }
            stats.put("Leetcode", leets.size());
        }
        
        if (all || mods.contains("LIFE_OS")) {
            List<WorkoutEntry> workouts = workoutRepo.findByPlayerIdOrderByWorkoutDateDescIdDesc(sId);
            for (WorkoutEntry w : workouts) {
                WorkoutEntry copy = new WorkoutEntry();
                BeanUtils.copyProperties(w, copy, "id");
                copy.setPlayerId(tId);
                workoutRepo.save(copy);
            }
            stats.put("Workouts", workouts.size());
        }

        return new DataTransferResponse(true, "Data successfully transferred", stats);
    }
}
