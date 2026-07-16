package com.thesystem.service;

import com.thesystem.entity.LearningLog;
import com.thesystem.entity.Player;
import com.thesystem.repository.PlayerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Scheduled jobs for the Learning OS module.
 * Executes daily at 10:00 AM to notify players about due recalls.
 */
@Service
public class LearningScheduler {

    private static final Logger log = LoggerFactory.getLogger(LearningScheduler.class);

    private final LearningService learningService;
    private final NotificationService notificationService;
    private final PlayerRepository playerRepository;

    public LearningScheduler(LearningService learningService,
                             NotificationService notificationService,
                             PlayerRepository playerRepository) {
        this.learningService = learningService;
        this.notificationService = notificationService;
        this.playerRepository = playerRepository;
    }

    // Runs every day at 10:00 AM server time
    @Scheduled(cron = "0 0 10 * * *")
    public void notifyDueRecalls() {
        log.info("Running daily recall due check...");
        
        List<Player> players = playerRepository.findAll();
        for (Player p : players) {
            List<LearningLog> due = learningService.getDueRecalls(p.getId());
            if (!due.isEmpty()) {
                String message = String.format("You have %d learning session(s) due for recall. Complete them to maintain your knowledge and earn XP.", due.size());
                notificationService.push(p.getId(), "Recalls Due 🧠", message, "SYSTEM");
                log.debug("Notified player {} about {} due recalls", p.getUsername(), due.size());
            }
        }
        
        log.info("Daily recall due check completed.");
    }
}
