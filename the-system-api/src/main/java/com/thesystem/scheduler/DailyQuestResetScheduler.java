package com.thesystem.scheduler;

import com.thesystem.entity.Player;
import com.thesystem.repository.PlayerRepository;
import com.thesystem.service.AiQuestGeneratorService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class DailyQuestResetScheduler {

    private static final Logger log = LoggerFactory.getLogger(DailyQuestResetScheduler.class);

    private final PlayerRepository playerRepository;
    private final AiQuestGeneratorService aiQuestGeneratorService;
    private final com.thesystem.repository.QuestGenerationLogRepository questGenerationLogRepository;

    public DailyQuestResetScheduler(PlayerRepository playerRepository, AiQuestGeneratorService aiQuestGeneratorService, com.thesystem.repository.QuestGenerationLogRepository questGenerationLogRepository) {
        this.playerRepository = playerRepository;
        this.aiQuestGeneratorService = aiQuestGeneratorService;
        this.questGenerationLogRepository = questGenerationLogRepository;
    }

    /**
     * Runs at midnight IST. 
     * Triggers dynamic AI quest generation for all players based on their current stats and skills.
     */
    @Scheduled(cron = "0 0 0 * * *", zone = "${thesystem.scheduler.timezone}")
    public void dailyReset() {
        LocalDate today = LocalDate.now();
        log.info("◈ THE SYSTEM — Daily quest reset triggered for {}. New gates await.", today);
        
        List<Player> players = playerRepository.findAll();
        for (Player p : players) {
            try {
                if (!questGenerationLogRepository.existsByPlayerIdAndGenerationDate(p.getId(), today)) {
                    aiQuestGeneratorService.generateDailyQuests(p.getId());
                    questGenerationLogRepository.save(new com.thesystem.entity.QuestGenerationLog(p.getId(), today));
                } else {
                    log.info("◈ THE SYSTEM — Quests already generated for player {} today.", p.getId());
                }
            } catch (Exception e) {
                log.error("Failed to generate AI quests for player {}", p.getId(), e);
            }
        }
    }
}

