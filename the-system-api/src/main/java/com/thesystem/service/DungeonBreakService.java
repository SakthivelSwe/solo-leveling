package com.thesystem.service;

import com.thesystem.entity.DungeonBreak;
import com.thesystem.entity.Player;
import com.thesystem.exception.ApiException;
import com.thesystem.repository.DungeonBreakRepository;
import com.thesystem.repository.PlayerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class DungeonBreakService {

    private final DungeonBreakRepository breakRepo;
    private final PlayerRepository playerRepo;
    private final AiMemoryService aiMemoryService;
    private final LevelService levelService;

    public DungeonBreakService(DungeonBreakRepository breakRepo,
                               PlayerRepository playerRepo,
                               AiMemoryService aiMemoryService,
                               LevelService levelService) {
        this.breakRepo = breakRepo;
        this.playerRepo = playerRepo;
        this.aiMemoryService = aiMemoryService;
        this.levelService = levelService;
    }

    public List<DungeonBreak> getActiveBreaks(Long playerId) {
        List<DungeonBreak> active = breakRepo.findActiveBreaks(playerId);
        LocalDateTime now = LocalDateTime.now();

        // Check for failures
        for (DungeonBreak db : active) {
            if (now.isAfter(db.getSpawnedAt().plusHours(db.getTimeLimitHours()))) {
                db.setFailed(true);
                breakRepo.save(db);

                // Apply penalty
                Player p = playerRepo.findById(playerId).orElse(null);
                if (p != null) {
                    p.setHp(Math.max(1, p.getHp() - 20)); // Penalty damage
                    playerRepo.save(p);
                }
                aiMemoryService.addImmediateMemory(playerId, "BEHAVIORAL",
                        "Failed to clear Dungeon Break: " + db.getTitle());
            }
        }

        return breakRepo.findActiveBreaks(playerId);
    }

    public DungeonBreak spawnRandomBreak(Long playerId) {
        // Only spawn if no active breaks
        if (!breakRepo.findActiveBreaks(playerId).isEmpty()) {
            return null;
        }

        DungeonBreak db = new DungeonBreak();
        db.setPlayerId(playerId);
        db.setTimeLimitHours(2);

        // Use ThreadLocalRandom — faster and better-seeded than new Random()
        int type = ThreadLocalRandom.current().nextInt(3);
        if (type == 0) {
            db.setTitle("E-Rank Gate: Sudden Fatigue");
            db.setDescription("Drink 1 Liter of water and do 20 pushups within 2 hours or suffer a 20 HP penalty.");
            db.setTargetMetric("PUSHUPS");
            db.setTargetValue(20);
        } else if (type == 1) {
            db.setTitle("D-Rank Gate: Algorithm Swarm");
            db.setDescription("Solve 1 Leetcode Easy within 2 hours to close the gate.");
            db.setTargetMetric("LEETCODE_EASY");
            db.setTargetValue(1);
        } else {
            db.setTitle("C-Rank Gate: Mind Flayer");
            db.setDescription("Complete a 10-minute meditation session immediately.");
            db.setTargetMetric("MEDITATION_MINS");
            db.setTargetValue(10);
        }

        DungeonBreak saved = breakRepo.save(db);
        aiMemoryService.addImmediateMemory(playerId, "SYSTEM",
                "WARNING: " + db.getTitle() + " spawned! You have " + db.getTimeLimitHours() + " hours.");
        return saved;
    }

    /**
     * FIX: Routes XP through LevelService.addXp() so level-up, rank-up, SSE push,
     * and achievement checks all fire correctly — matching how quest completions work.
     */
    @Transactional
    public DungeonBreak clearBreak(Long breakId, Long playerId) {
        DungeonBreak db = breakRepo.findById(breakId)
                .orElseThrow(() -> new ApiException("Dungeon Break not found", HttpStatus.NOT_FOUND));

        // SEC FIX: Return 403 instead of 500 for cross-player access attempts
        if (!db.getPlayerId().equals(playerId)) {
            throw new ApiException("You do not have permission to clear this Dungeon Break", HttpStatus.FORBIDDEN);
        }
        if (db.isFailed() || db.isCleared()) {
            throw new ApiException("Dungeon Break already resolved", HttpStatus.CONFLICT);
        }

        db.setCleared(true);
        breakRepo.save(db);

        Player p = playerRepo.findById(playerId).orElseThrow();
        p.setSystemGold(p.getSystemGold() + 500); // Reward: 500 Gold
        playerRepo.save(p);

        // FIX: Route XP through LevelService so level-up/rank-up/SSE all trigger correctly
        levelService.addXp(p, 1000, "DUNGEON_BREAK_CLEAR");

        aiMemoryService.addImmediateMemory(playerId, "SYSTEM",
                "Successfully cleared Dungeon Break: " + db.getTitle() + ". Acquired 500 Gold & 1000 XP.");

        return db;
    }
}
