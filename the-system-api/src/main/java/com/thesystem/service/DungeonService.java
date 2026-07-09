package com.thesystem.service;

import com.thesystem.dto.DungeonDTO;
import com.thesystem.dto.LevelUpDTO;
import com.thesystem.entity.Dungeon;
import com.thesystem.entity.Player;
import com.thesystem.exception.ApiException;
import com.thesystem.repository.DungeonRepository;
import com.thesystem.repository.PlayerRepository;
import com.thesystem.repository.QuestCompletionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.Map;

/**
 * Weekly Gate raids. A boss's HP falls as the Hunter clears quests through the week;
 * felling it grants a one-time bonus-XP reward. A fresh gate spawns every Monday.
 */
@Service
public class DungeonService {

    private static final int DMG_PER_QUEST = 10;

    private final DungeonRepository dungeonRepository;
    private final QuestCompletionRepository completionRepository;
    private final PlayerRepository playerRepository;
    private final LevelService levelService;
    private final NotificationService notificationService;
    private final SseService sseService;

    public DungeonService(DungeonRepository dungeonRepository,
                          QuestCompletionRepository completionRepository,
                          PlayerRepository playerRepository,
                          LevelService levelService,
                          NotificationService notificationService,
                          SseService sseService) {
        this.dungeonRepository = dungeonRepository;
        this.completionRepository = completionRepository;
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

        int questsThisWeek = (int) completionRepository
                .findByPlayerIdAndCompletedAtBetween(playerId, weekStart, today).size();
        int damage = Math.min(dungeon.getTotalHp(), questsThisWeek * DMG_PER_QUEST);
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
        int questsToClear = dungeon.getTotalHp() / DMG_PER_QUEST;
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
        int target = switch (rank == null ? "E" : rank) {
            case "D" -> 24; case "C" -> 28; case "B" -> 32; case "A" -> 36; case "S" -> 40;
            default -> 20;
        };
        int reward = target * 14;   // ~280–560 XP by rank
        String name = switch (rank == null ? "E" : rank) {
            case "D" -> "D-Rank Gate: The Broken Spire";
            case "C" -> "C-Rank Gate: The Iron Fortress";
            case "B" -> "B-Rank Gate: The Frozen Abyss";
            case "A" -> "A-Rank Gate: The Ashen Throne";
            case "S" -> "S-Rank Gate: The Monarch's Domain";
            default -> "E-Rank Gate: The Awakening Hollow";
        };
        String boss = switch (rank == null ? "E" : rank) {
            case "D" -> "Stone Sentinel";
            case "C" -> "Iron Golem";
            case "B" -> "Frost Warden";
            case "A" -> "Flame Marshal";
            case "S" -> "Shadow Sovereign";
            default -> "Lesser Wraith";
        };
        return new Dungeon(playerId, weekStart, name, boss, target * DMG_PER_QUEST, reward);
    }
}

