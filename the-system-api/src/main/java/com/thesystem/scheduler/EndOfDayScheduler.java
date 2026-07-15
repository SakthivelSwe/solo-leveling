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
        int yesterdayDow = yesterday.getDayOfWeek().getValue(); // 1=Mon … 7=Sun (ISO-8601)
        List<Player> players = playerRepository.findAll();

        for (Player player : players) {
            long rawQuestsDone = completionRepository
                    .countByPlayerIdAndCompletedAt(player.getId(), yesterday);

            // Rest-day mode: if yesterday matched the player's configured rest day,
            // recovery quests count double (they contribute 2 toward the threshold)
            // and the HP penalty threshold drops from 4 → 2.
            boolean wasRestDay = player.isRestDayActive()
                    && player.getRestDayDayOfWeek() == yesterdayDow;

            // Count recovery quests separately so they can count double
            long recoveryQuestsDone = completionRepository
                    .countRecoveryQuestsByPlayerIdAndCompletedAt(player.getId(), yesterday);
            long normalQuestsDone = rawQuestsDone - recoveryQuestsDone;
            // Effective count: recovery quests count 2×, normal count 1×
            int effectiveDone = (int) (normalQuestsDone + (recoveryQuestsDone * 2));

            // Thresholds shift on rest days
            int thresholdPerfect  = wasRestDay ? 6 : 10;
            int thresholdStrong   = wasRestDay ? 4 : 7;
            int thresholdMinimum  = wasRestDay ? 2 : 4; // below this = HP penalty

            int hpChange = effectiveDone >= thresholdPerfect ? 5
                         : effectiveDone >= thresholdStrong  ? 0
                         : effectiveDone >= thresholdMinimum ? -5
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
                String restNote = wasRestDay ? " (rest-day threshold applied)" : "";
                notificationService.push(player.getId(), "◈ HP LOST",
                        "Only " + effectiveDone + " effective quests cleared yesterday. HP " + hpChange
                                + ". Push harder today." + restNote, "SYSTEM");
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

