package com.thesystem.service;

import com.thesystem.dto.DungeonDTO;
import com.thesystem.dto.LevelUpDTO;
import com.thesystem.entity.Dungeon;
import com.thesystem.entity.Player;
import com.thesystem.entity.QuestCompletion;
import com.thesystem.exception.ApiException;
import com.thesystem.repository.DungeonRepository;
import com.thesystem.repository.PlayerRepository;
import com.thesystem.repository.QuestCompletionRepository;
import com.thesystem.repository.QuestRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Weekly Gate raids. A boss's HP falls as the Hunter clears quests through the week;
 * felling it grants a one-time bonus-XP reward. A fresh gate spawns every Monday.
 *
 * Boss damage is now WEIGHTED — high-effort quests (CODE_NO_AI=80, LEETCODE=50)
 * deal far more damage than minor habits (WATER=5). This makes clearing a Gate
 * require meaningful work, not just quest-count farming.
 */
@Service
public class DungeonService {

    /** Fallback damage used only when a quest has no boss_damage value set (legacy). */
    private static final int FALLBACK_DMG = 10;

    private final DungeonRepository dungeonRepository;
    private final QuestCompletionRepository completionRepository;
    private final QuestRepository questRepository;
    private final PlayerRepository playerRepository;
    private final LevelService levelService;
    private final NotificationService notificationService;
    private final SseService sseService;

    public DungeonService(DungeonRepository dungeonRepository,
                          QuestCompletionRepository completionRepository,
                          QuestRepository questRepository,
                          PlayerRepository playerRepository,
                          LevelService levelService,
                          NotificationService notificationService,
                          SseService sseService) {
        this.dungeonRepository = dungeonRepository;
        this.completionRepository = completionRepository;
        this.questRepository = questRepository;
        this.playerRepository = playerRepository;
        this.levelService = levelService;
        this.notificationService = notificationService;
        this.sseService = sseService;
    }

    @Transactional
    public DungeonDTO getCurrentDungeon(Long playerId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new ApiException("Player not found", HttpStatus.NOT_FOUND));

        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        Dungeon dungeon = dungeonRepository.findByPlayerIdAndWeekStart(playerId, weekStart)
                .orElseGet(() -> dungeonRepository.save(spawn(playerId, weekStart, player.getRankLevel())));

        // Sum weighted boss damage for all quests completed this week.
        // Each quest carries its own bossDamage value (CODE_NO_AI=80, LEETCODE=50, WATER=5, etc.).
        // This replaces the old flat count × 10 formula.
        List<QuestCompletion> weekCompletions =
                completionRepository.findByPlayerIdAndCompletedAtBetween(playerId, weekStart, today);

        // Build a map of questId → bossDamage for efficient lookup
        java.util.Map<Long, Integer> damageMap = new java.util.HashMap<>();
        questRepository.findAll().forEach(q -> damageMap.put(q.getId(), q.getBossDamage()));

        int damage = Math.min(dungeon.getTotalHp(),
                weekCompletions.stream()
                        .mapToInt(c -> damageMap.getOrDefault(c.getQuestId(), FALLBACK_DMG))
                        .sum());
        int questsThisWeek = weekCompletions.size();
        dungeon.setDamageDealt(damage);

        boolean justCleared = false;
        if (!dungeon.isCleared() && damage >= dungeon.getTotalHp()) {
            dungeon.setCleared(true);
            dungeon.setClearedAt(LocalDateTime.now());
            grantReward(player, dungeon);
            justCleared = true;
        }
        dungeonRepository.save(dungeon);

        int currentHp = Math.max(0, dungeon.getTotalHp() - damage);
        // questsToClear is now a rough guide based on average quest damage
        int avgDamage = damageMap.isEmpty() ? FALLBACK_DMG
                : (int) damageMap.values().stream().mapToInt(Integer::intValue).average().orElse(FALLBACK_DMG);
        int questsToClear = avgDamage == 0 ? dungeon.getTotalHp() : dungeon.getTotalHp() / avgDamage;
        int pct = dungeon.getTotalHp() == 0 ? 0
                : (int) Math.round(100.0 * damage / dungeon.getTotalHp());

        return new DungeonDTO(dungeon.getName(), dungeon.getBossName(), dungeon.getTotalHp(),
                currentHp, damage, questsThisWeek, questsToClear, dungeon.isCleared(),
                justCleared, dungeon.getRewardXp(), pct, weekStart.toString());
    }

    private void grantReward(Player player, Dungeon dungeon) {
        int xp = dungeon.getRewardXp();
        player.setCurrentXp(player.getCurrentXp() + xp);
        player.setTotalXp(player.getTotalXp() + xp);
        LevelUpDTO levelUp = levelService.checkLevelUp(player);
        playerRepository.save(player);

        notificationService.push(player.getId(), "◈ GATE CLEARED",
                "You felled " + dungeon.getBossName() + " and cleared " + dungeon.getName()
                        + ". Reward: +" + xp + " XP. The System acknowledges your raid.", "SYSTEM");

        sseService.send(player.getId(), "player-update", Map.of(
                "currentXp", player.getCurrentXp(),
                "totalXp", player.getTotalXp(),
                "level", player.getLevel(),
                "rankLevel", player.getRankLevel(),
                "hp", player.getHp(),
                "maxHp", player.getMaxHp(),
                "leveledUp", levelUp.leveledUp(),
                "gateCleared", true));
    }

    private Dungeon spawn(Long playerId, LocalDate weekStart, String rank) {
        // totalHp is calibrated so a dedicated hunter clearing all critical quests each day
        // can clear the gate. Average boss damage per quest × expected quests per week.
        // Critical quests alone: CODE_NO_AI(80)+LEETCODE(50)+ENGLISH(40)+EXERCISE(30) = 200 per day
        // Gate should require roughly 3-4 focused days to clear.
        int totalHp = switch (rank == null ? "E" : rank) {
            case "D" -> 800; case "C" -> 1000; case "B" -> 1200;
            case "A" -> 1500; case "S" -> 2000;
            default  -> 600;  // E-rank: ~3 good days of critical quests
        };
        int reward = switch (rank == null ? "E" : rank) {
            case "D" -> 336; case "C" -> 392; case "B" -> 448;
            case "A" -> 504; case "S" -> 560;
            default  -> 280; // E-rank baseline
        };
        String name = switch (rank == null ? "E" : rank) {
            case "D" -> "D-Rank Gate: The Broken Spire";
            case "C" -> "C-Rank Gate: The Iron Fortress";
            case "B" -> "B-Rank Gate: The Frozen Abyss";
            case "A" -> "A-Rank Gate: The Ashen Throne";
            case "S" -> "S-Rank Gate: The Monarch's Domain";
            default  -> "E-Rank Gate: The Awakening Hollow";
        };
        String boss = switch (rank == null ? "E" : rank) {
            case "D" -> "Stone Sentinel";
            case "C" -> "Iron Golem";
            case "B" -> "Frost Warden";
            case "A" -> "Flame Marshal";
            case "S" -> "Shadow Sovereign";
            default  -> "Lesser Wraith";
        };
        return new Dungeon(playerId, weekStart, name, boss, totalHp, reward);
    }
}

