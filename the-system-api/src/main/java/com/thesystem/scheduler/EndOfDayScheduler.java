package com.thesystem.scheduler;

import com.thesystem.entity.Player;
import com.thesystem.repository.PlayerRepository;
import com.thesystem.repository.QuestCompletionRepository;
import com.thesystem.service.LevelService;
import com.thesystem.service.NotificationService;
import com.thesystem.service.SseService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Gamification Plus (Module 7) — HP System.
 * At midnight IST, evaluates yesterday's quest count and adjusts each player's HP.
 * If HP hits 0, the player is demoted one rank and HP resets to 50.
 */
@Component
public class EndOfDayScheduler {

    private static final Logger log = LoggerFactory.getLogger(EndOfDayScheduler.class);

    private final PlayerRepository playerRepository;
    private final QuestCompletionRepository completionRepository;
    private final LevelService levelService;
    private final NotificationService notificationService;
    private final SseService sseService;

    public EndOfDayScheduler(PlayerRepository playerRepository,
                             QuestCompletionRepository completionRepository,
                             LevelService levelService,
                             NotificationService notificationService,
                             SseService sseService) {
        this.playerRepository = playerRepository;
        this.completionRepository = completionRepository;
        this.levelService = levelService;
        this.notificationService = notificationService;
        this.sseService = sseService;
    }

    @Scheduled(cron = "0 0 0 * * *", zone = "${thesystem.scheduler.timezone}")
    @Transactional
    public void processEndOfDay() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        List<Player> players = playerRepository.findAll();

        for (Player player : players) {
            int questsDone = (int) completionRepository
                    .countByPlayerIdAndCompletedAt(player.getId(), yesterday);

            int hpChange = questsDone >= 10 ? 5
                         : questsDone >= 7  ? 0
                         : questsDone >= 4  ? -5
                         : -20;

            int newHp = Math.max(0, Math.min(player.getMaxHp(), player.getHp() + hpChange));
            player.setHp(newHp);

            if (newHp == 0) {
                boolean demoted = levelService.demoteRank(player);
                player.setHp(50);
                if (demoted) {
                    notificationService.push(player.getId(), "◈ RANK DROP",
                            "Your HP reached 0. The System has demoted you to " + player.getRankLevel()
                                    + "-Rank. Rise again, Hunter.", "RANK_DROP");
                    log.warn("◈ Player {} demoted to {}-Rank (HP depleted).",
                            player.getUsername(), player.getRankLevel());
                }
            } else if (hpChange < 0) {
                notificationService.push(player.getId(), "◈ HP LOST",
                        "Only " + questsDone + " quests cleared yesterday. HP " + hpChange
                                + ". The weak fall behind. Push harder today.", "SYSTEM");
            } else if (hpChange > 0) {
                notificationService.push(player.getId(), "◈ HP RESTORED",
                        "Perfect clearance yesterday. +" + hpChange + " HP. The System acknowledges you.",
                        "SYSTEM");
            }

            playerRepository.save(player);

            // Real-time: push the fresh HP / rank to any live tab.
            sseService.send(player.getId(), "player-update", java.util.Map.of(
                    "hp", player.getHp(),
                    "maxHp", player.getMaxHp(),
                    "level", player.getLevel(),
                    "rankLevel", player.getRankLevel()));
        }
        log.info("◈ THE SYSTEM — End-of-day HP processing complete for {} players.", players.size());
    }
}

