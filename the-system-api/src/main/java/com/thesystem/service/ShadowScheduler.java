package com.thesystem.service;

import com.thesystem.entity.Player;
import com.thesystem.repository.HabitRepository;
import com.thesystem.repository.HabitCompletionRepository;
import com.thesystem.repository.PlayerRepository;
import com.thesystem.service.LevelService;
import com.thesystem.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Shadow Army Scheduler — THE SYSTEM's passive XP engine.
 *
 * At 3:00 AM, checks every player's mastered habits (66+ day streak).
 * For each mastered habit completed TODAY, the player earns 10 passive XP.
 * This is the "Shadow Army" mechanic: your mastered disciplines work FOR you.
 *
 * Also processes returning shadows (original 5-minute logic preserved).
 */
@Service
public class ShadowScheduler {

    private static final Logger log = LoggerFactory.getLogger(ShadowScheduler.class);
    private static final int MASTERY_DAYS = 66;
    private static final int PASSIVE_XP_PER_MASTERED_HABIT = 10;

    private final ShadowService shadowService;
    private final PlayerRepository playerRepository;
    private final HabitRepository habitRepository;
    private final HabitCompletionRepository completionRepository;
    private final LevelService levelService;
    private final NotificationService notificationService;

    public ShadowScheduler(ShadowService shadowService,
                           PlayerRepository playerRepository,
                           HabitRepository habitRepository,
                           HabitCompletionRepository completionRepository,
                           LevelService levelService,
                           NotificationService notificationService) {
        this.shadowService = shadowService;
        this.playerRepository = playerRepository;
        this.habitRepository = habitRepository;
        this.completionRepository = completionRepository;
        this.levelService = levelService;
        this.notificationService = notificationService;
    }

    /** Every 5 minutes — process returning shadows (time-based mission returns). */
    @Scheduled(fixedRate = 300_000)
    public void checkReturningShadows() {
        List<Player> players = playerRepository.findAll();
        for (Player p : players) {
            shadowService.processReturningShadows(p.getId());
        }
    }

    /**
     * 3:00 AM IST — Shadow Army Passive XP.
     *
     * For each player, counts mastered habits (currentStreak >= 66 days) that were
     * completed YESTERDAY (the day just ended). Awards 10 XP per mastered completion.
     * Mastered habits that were skipped earn no passive XP — the Shadow Army only
     * works if you keep showing up.
     */
    @Scheduled(cron = "0 0 3 * * *", zone = "${thesystem.scheduler.timezone}")
    @Transactional
    public void shadowArmyPassiveXp() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        List<Player> players = playerRepository.findAll();
        int totalPlayersRewarded = 0;

        for (Player player : players) {
            try {
                // Count mastered habits that were also completed yesterday
                long masteredAndCompleted = habitRepository
                        .findByPlayerIdAndArchivedFalseOrderByKeystoneDescCreatedAtAsc(player.getId())
                        .stream()
                        .filter(h -> h.getCurrentStreak() >= MASTERY_DAYS
                                && completionRepository.existsByPlayerIdAndHabitIdAndCompletedAt(
                                        player.getId(), h.getId(), yesterday))
                        .count();

                if (masteredAndCompleted > 0) {
                    int passiveXp = (int) masteredAndCompleted * PASSIVE_XP_PER_MASTERED_HABIT;
                    levelService.addXp(player, passiveXp, "SHADOW_ARMY_PASSIVE");

                    notificationService.push(player.getId(), "◈ SHADOW ARMY — PASSIVE XP",
                            masteredAndCompleted + " mastered shadow" +
                            (masteredAndCompleted > 1 ? "s" : "") +
                            " worked for you overnight. +" + passiveXp +
                            " XP collected. Keep the streak, Hunter.", "SYSTEM");

                    totalPlayersRewarded++;
                    log.debug("◈ Shadow Army passive XP: player={} habits={} xp={}",
                            player.getUsername(), masteredAndCompleted, passiveXp);
                }
            } catch (Exception e) {
                log.error("◈ Shadow Army XP failed for player {}: {}", player.getUsername(), e.getMessage());
            }
        }
        log.info("◈ THE SYSTEM — Shadow Army passive XP processed. {} players rewarded.", totalPlayersRewarded);
    }
}
