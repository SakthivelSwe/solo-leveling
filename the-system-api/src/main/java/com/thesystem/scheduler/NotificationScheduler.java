package com.thesystem.scheduler;

import com.thesystem.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Notification OS (Module 8). THE SYSTEM issues scheduled alerts in its cold,
 * powerful tone. Alerts are persisted per player and shown in the UI.
 */
@Component
public class NotificationScheduler {

    private static final Logger log = LoggerFactory.getLogger(NotificationScheduler.class);
    private final NotificationService notificationService;

    public NotificationScheduler(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    // 6:30 AM — Wake Protocol (before office routine starts)
    @Scheduled(cron = "0 30 6 * * *", zone = "${thesystem.scheduler.timezone}")
    public void morningProtocol() {
        notificationService.broadcast("◈ SYSTEM ALERT",
                "Hunter, a new day begins. Exercise and breakfast before 10:00 AM.", "REMINDER");
    }

    // 1:00 PM — Lunch Alert
    @Scheduled(cron = "0 0 13 * * *", zone = "${thesystem.scheduler.timezone}")
    public void lunchAlert() {
        notificationService.broadcast("◈ FUEL REQUIRED",
                "Eat a proper meal. Zinc fuels testosterone. A hunter doesn't skip fuel.", "REMINDER");
    }

    // 9:00 PM — Evening Quest Push
    @Scheduled(cron = "0 0 21 * * *", zone = "${thesystem.scheduler.timezone}")
    public void eveningQuestPush() {
        notificationService.broadcast("◈ QUESTS REMAINING",
                "Code without AI. LeetCode. English. You have 2 hours. Move.", "REMINDER");
    }

    // 11:00 PM — Sleep Protocol
    @Scheduled(cron = "0 0 23 * * *", zone = "${thesystem.scheduler.timezone}")
    public void sleepProtocol() {
        notificationService.broadcast("◈ SLEEP PROTOCOL",
                "Phone down. No reels. Testosterone builds in sleep. Put it down.", "REMINDER");
    }

    // Sunday 8:00 PM — Weekly Review
    @Scheduled(cron = "0 0 20 * * SUN", zone = "${thesystem.scheduler.timezone}")
    public void weeklyReview() {
        notificationService.broadcast("◈ WEEKLY REVIEW",
                "7 days complete. Check your stats. Plan next week.", "SYSTEM");
        log.info("◈ THE SYSTEM — Weekly review notifications dispatched.");
    }
}

