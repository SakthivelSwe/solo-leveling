package com.thesystem.scheduler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class DailyQuestResetScheduler {

    private static final Logger log = LoggerFactory.getLogger(DailyQuestResetScheduler.class);

    /**
     * Runs at midnight IST. Quest completions are date-based, so no deletion is needed —
     * a new day simply presents fresh, uncompleted quests.
     */
    @Scheduled(cron = "0 0 0 * * *", zone = "${thesystem.scheduler.timezone}")
    public void dailyReset() {
        log.info("◈ THE SYSTEM — Daily quest reset triggered for {}. New gates await.", LocalDate.now());
    }
}

