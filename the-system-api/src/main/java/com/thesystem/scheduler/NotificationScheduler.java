package com.thesystem.scheduler;

import com.thesystem.entity.EmiEntry;
import com.thesystem.entity.Player;
import com.thesystem.entity.SocialConnection;
import com.thesystem.entity.SubscriptionEntry;
import com.thesystem.repository.EmiEntryRepository;
import com.thesystem.repository.PlayerRepository;
import com.thesystem.repository.QuestCompletionRepository;
import com.thesystem.repository.QuestRepository;
import com.thesystem.repository.SocialConnectionRepository;
import com.thesystem.repository.SubscriptionEntryRepository;
import com.thesystem.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Notification OS — THE SYSTEM issues scheduled alerts in its cold, powerful tone.
 * Alerts are persisted per player and shown in the UI.
 *
 * UPGRADED:
 *  - 10 PM daily summary is now PERSONALISED per player (shows actual quest count).
 *  - Bill reminders check real EMI + subscription due dates.
 *  - Birthday / anniversary reminders from SocialConnection.
 */
@Component
public class NotificationScheduler {

    private static final Logger log = LoggerFactory.getLogger(NotificationScheduler.class);

    private final NotificationService notificationService;
    private final PlayerRepository playerRepository;
    private final QuestCompletionRepository completionRepository;
    private final QuestRepository questRepository;
    private final EmiEntryRepository emiRepository;
    private final SubscriptionEntryRepository subscriptionRepository;
    private final SocialConnectionRepository socialRepository;

    public NotificationScheduler(NotificationService notificationService,
                                  PlayerRepository playerRepository,
                                  QuestCompletionRepository completionRepository,
                                  QuestRepository questRepository,
                                  EmiEntryRepository emiRepository,
                                  SubscriptionEntryRepository subscriptionRepository,
                                  SocialConnectionRepository socialRepository) {
        this.notificationService = notificationService;
        this.playerRepository = playerRepository;
        this.completionRepository = completionRepository;
        this.questRepository = questRepository;
        this.emiRepository = emiRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.socialRepository = socialRepository;
    }

    // ── Fixed daily broadcasts ────────────────────────────────────────────────

    /** 6:30 AM — Wake Protocol */
    @Scheduled(cron = "0 30 6 * * *", zone = "${thesystem.scheduler.timezone}")
    public void morningProtocol() {
        notificationService.broadcast("◈ SYSTEM ALERT",
                "Hunter, a new day begins. Exercise and breakfast before 10:00 AM.", "REMINDER");
        log.info("◈ Morning protocol dispatched.");
    }

    /** 1:00 PM — Lunch Alert */
    @Scheduled(cron = "0 0 13 * * *", zone = "${thesystem.scheduler.timezone}")
    public void lunchAlert() {
        notificationService.broadcast("◈ FUEL REQUIRED",
                "Eat a proper meal. Zinc fuels testosterone. A hunter doesn't skip fuel.", "REMINDER");
    }

    /** 9:00 PM — Generic evening push (kept as motivation, distinct from 10 PM summary) */
    @Scheduled(cron = "0 0 21 * * *", zone = "${thesystem.scheduler.timezone}")
    public void eveningQuestPush() {
        notificationService.broadcast("◈ FINAL PUSH",
                "The day is not over. Code without AI. LeetCode. English. Move.", "REMINDER");
    }

    /** 11:00 PM — Sleep Protocol */
    @Scheduled(cron = "0 0 23 * * *", zone = "${thesystem.scheduler.timezone}")
    public void sleepProtocol() {
        notificationService.broadcast("◈ SLEEP PROTOCOL",
                "Phone down. No reels. Testosterone builds in sleep. Put it down.", "REMINDER");
    }

    /** Sunday 8:00 PM — Weekly Review */
    @Scheduled(cron = "0 0 20 * * SUN", zone = "${thesystem.scheduler.timezone}")
    public void weeklyReview() {
        notificationService.broadcast("◈ WEEKLY REVIEW",
                "7 days complete. Check your stats. Plan next week.", "SYSTEM");
        log.info("◈ THE SYSTEM — Weekly review notifications dispatched.");
    }

    // ── Personalised 10 PM Daily Summary ─────────────────────────────────────

    /**
     * 10:00 PM — Per-player personalised quest summary.
     * Shows exactly how many quests the player completed vs available today,
     * and whether they hit the perfect threshold (10+ quests).
     */
    @Scheduled(cron = "0 0 22 * * *", zone = "${thesystem.scheduler.timezone}")
    public void dailySummary() {
        LocalDate today = LocalDate.now();
        List<Player> players = playerRepository.findAll();

        for (Player player : players) {
            try {
                long completed = completionRepository.countByPlayerIdAndCompletedAt(player.getId(), today);

                // Count available daily quests for this player's level
                long available = questRepository.findDailyQuestsForPlayer(player.getId(), player.getLevel()).size();

                String title = "◈ DAILY SUMMARY";
                String message;
                String type;

                if (completed == 0) {
                    message = "Zero quests cleared today, " + displayName(player) +
                              ". The System is disappointed. Tomorrow, rise.";
                    type = "SYSTEM_PENALTY";
                } else if (completed >= 10) {
                    message = "PERFECT CLEARANCE — " + completed + "/" + available +
                              " quests. +" + 5 + " HP incoming. The System acknowledges you, " +
                              displayName(player) + ".";
                    type = "SYSTEM";
                } else if (completed >= 4) {
                    message = completed + "/" + available + " quests cleared today. " +
                              (10 - completed) + " more would have hit perfect. Push harder tomorrow.";
                    type = "REMINDER";
                } else {
                    message = "Only " + completed + "/" + available + " quests cleared, " +
                              displayName(player) + ". Below minimum threshold. HP deduction incoming.";
                    type = "SYSTEM_PENALTY";
                }

                notificationService.push(player.getId(), title, message, type);

            } catch (Exception e) {
                log.error("◈ Daily summary failed for player {}: {}", player.getUsername(), e.getMessage());
            }
        }
        log.info("◈ THE SYSTEM — Personalised daily summaries dispatched to {} players.", players.size());
    }

    // ── Bill Reminder Notifications ───────────────────────────────────────────

    /**
     * 9:00 AM daily — Checks for EMIs and subscriptions due within the next 3 days.
     * Sends a targeted System alert per player so they don't miss payments.
     */
    @Scheduled(cron = "0 0 9 * * *", zone = "${thesystem.scheduler.timezone}")
    public void billReminders() {
        LocalDate today = LocalDate.now();
        LocalDate in3Days = today.plusDays(3);
        List<Player> players = playerRepository.findAll();

        for (Player player : players) {
            try {
                // Check EMIs due within 3 days
                List<EmiEntry> dueEmis = emiRepository
                        .findByPlayerIdOrderByNextDueDateAsc(player.getId()).stream()
                        .filter(e -> "ACTIVE".equals(e.getStatus())
                                && e.getNextDueDate() != null
                                && !e.getNextDueDate().isBefore(today)
                                && !e.getNextDueDate().isAfter(in3Days))
                        .toList();

                for (EmiEntry emi : dueEmis) {
                    long daysLeft = java.time.temporal.ChronoUnit.DAYS.between(today, emi.getNextDueDate());
                    String when = daysLeft == 0 ? "TODAY" : "in " + daysLeft + " day" + (daysLeft == 1 ? "" : "s");
                    notificationService.push(player.getId(), "◈ EMI DUE " + when.toUpperCase(),
                            emi.getLoanName() + " — ₹" + String.format("%.0f", emi.getEmiAmount()) +
                            " due " + emi.getNextDueDate().format(DateTimeFormatter.ofPattern("d MMM")) +
                            ". Don't miss it, Hunter.", "WEALTH");
                }

                // Check active subscriptions due within 3 days
                List<SubscriptionEntry> dueSubs = subscriptionRepository
                        .findByPlayerIdAndIsActive(player.getId(), true).stream()
                        .filter(s -> s.getNextBillingDate() != null
                                && !s.getNextBillingDate().isBefore(today)
                                && !s.getNextBillingDate().isAfter(in3Days))
                        .toList();

                for (SubscriptionEntry sub : dueSubs) {
                    long daysLeft = java.time.temporal.ChronoUnit.DAYS.between(today, sub.getNextBillingDate());
                    String when = daysLeft == 0 ? "TODAY" : "in " + daysLeft + " day" + (daysLeft == 1 ? "" : "s");
                    notificationService.push(player.getId(), "◈ SUBSCRIPTION RENEWAL " + when.toUpperCase(),
                            sub.getName() + " — ₹" + String.format("%.0f", sub.getAmount()) +
                            " renews " + sub.getNextBillingDate().format(DateTimeFormatter.ofPattern("d MMM")) +
                            ". Budget allocated?", "WEALTH");
                }

            } catch (Exception e) {
                log.error("◈ Bill reminders failed for player {}: {}", player.getUsername(), e.getMessage());
            }
        }
    }

    // ── Birthday / Anniversary Reminders ─────────────────────────────────────

    /**
     * 8:00 AM daily — Scans all SocialConnections for birthdays and anniversaries today.
     * Pushes a personalised System reminder so the Hunter never misses a special date.
     */
    @Scheduled(cron = "0 0 8 * * *", zone = "${thesystem.scheduler.timezone}")
    public void birthdayAndAnniversaryReminders() {
        LocalDate today = LocalDate.now();
        List<Player> players = playerRepository.findAll();

        for (Player player : players) {
            try {
                List<SocialConnection> connections = socialRepository.findAllByPlayerId(player.getId());

                for (SocialConnection conn : connections) {
                    // Check birthday (match month + day only, ignoring year)
                    if (conn.getBirthday() != null
                            && conn.getBirthday().getMonthValue() == today.getMonthValue()
                            && conn.getBirthday().getDayOfMonth() == today.getDayOfMonth()) {
                        int age = today.getYear() - conn.getBirthday().getYear();
                        notificationService.push(player.getId(), "◈ BIRTHDAY — " + conn.getName().toUpperCase(),
                                "Today is " + conn.getName() + "'s birthday" +
                                (age > 0 ? " (turning " + age + ")" : "") +
                                ". Call or message them. Bonds require maintenance, Hunter.", "RELATIONSHIP");
                    }

                    // Check anniversary
                    if (conn.getAnniversary() != null
                            && conn.getAnniversary().getMonthValue() == today.getMonthValue()
                            && conn.getAnniversary().getDayOfMonth() == today.getDayOfMonth()) {
                        notificationService.push(player.getId(), "◈ ANNIVERSARY — " + conn.getName().toUpperCase(),
                                "Anniversary with " + conn.getName() + " today. " +
                                "Acknowledge it. Presence is the greatest gift.", "RELATIONSHIP");
                    }
                }
            } catch (Exception e) {
                log.error("◈ Birthday reminders failed for player {}: {}", player.getUsername(), e.getMessage());
            }
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String displayName(Player player) {
        return player.getDisplayName() != null && !player.getDisplayName().isBlank()
                ? player.getDisplayName() : player.getUsername();
    }
}
