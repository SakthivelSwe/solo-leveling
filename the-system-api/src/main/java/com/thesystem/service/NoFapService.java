package com.thesystem.service;

import com.thesystem.dto.NoFapStatusDTO;
import com.thesystem.dto.NoFapStatusDTO.ScienceDayCard;
import com.thesystem.dto.NoFapStatusDTO.AddictionInsight;
import com.thesystem.entity.DopamineLog;
import com.thesystem.repository.DopamineLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

import com.thesystem.entity.Player;
import com.thesystem.repository.PlayerRepository;
import com.thesystem.service.LevelService;

/**
 * No Fap Challenge Service.
 *
 * Computes streak, milestones, science cards, and addiction insights
 * entirely from the existing dopamine_logs table (pornViewed column).
 *
 * Streak logic:
 *   - Walk backwards day by day from today.
 *   - A day with pornViewed=false counts. A day with pornViewed=true or no record breaks the streak.
 *   - Today with no record is treated as "not yet confirmed" (not a relapse — streak holds).
 *
 * XP bonus: 5% per completed 7-day clean block, capped at 50%.
 */
@Service
public class NoFapService {

    private final DopamineLogRepository logRepo;
    private final PlayerRepository playerRepo;
    private final LevelService levelService;
    private final AiMemoryService aiMemoryService;

    public NoFapService(DopamineLogRepository logRepo,
                        PlayerRepository playerRepo,
                        LevelService levelService,
                        AiMemoryService aiMemoryService) {
        this.logRepo = logRepo;
        this.playerRepo = playerRepo;
        this.levelService = levelService;
        this.aiMemoryService = aiMemoryService;
    }

    // ────────────────────────────────────────────────────────────────────────
    // Public API
    // ────────────────────────────────────────────────────────────────────────

    /**
     * Backfill clean days from a user-supplied start date to yesterday.
     *
     * Use case: User started their challenge before installing the app.
     * They pick "I started 5 days ago" → we create pornViewed=false entries
     * for each of those past days so the streak is computed correctly.
     *
     * Rules:
     *  - startDate must be in the past (not today or future).
     *  - Max look-back: 365 days to prevent abuse.
     *  - We do NOT overwrite any existing log entries (skip days already recorded).
     *  - Today is NOT touched — user must confirm/relapse today separately.
     *
     * @param playerId  The authenticated player's ID.
     * @param startDate The date the challenge actually began.
     * @return Updated NoFapStatusDTO reflecting the new streak.
     */
    @Transactional
    public NoFapStatusDTO setStartDate(Long playerId, LocalDate startDate) {
        int oldStreak = getStatus(playerId).getCurrentStreak();

        LocalDate today    = LocalDate.now();
        LocalDate earliest = today.minusDays(365);

        // Validate: must be a past date within 365 days
        if (!startDate.isBefore(today)) {
            throw new IllegalArgumentException("Start date must be before today.");
        }
        if (startDate.isBefore(earliest)) {
            throw new IllegalArgumentException("Start date cannot be more than 365 days ago.");
        }

        // Fetch all existing logs in the range so we don't overwrite them
        Map<LocalDate, DopamineLog> existing = logRepo
                .findByPlayerIdAndLogDateBetweenOrderByLogDateDesc(playerId, startDate, today.minusDays(1))
                .stream()
                .collect(Collectors.toMap(DopamineLog::getLogDate, l -> l));

        // Walk each day from startDate up to (but not including) today
        LocalDate cursor = startDate;
        List<DopamineLog> toSave = new ArrayList<>();
        while (cursor.isBefore(today)) {
            if (!existing.containsKey(cursor)) {
                // Day not yet recorded — create a clean entry
                DopamineLog log = new DopamineLog();
                log.setPlayerId(playerId);
                log.setLogDate(cursor);
                log.setPornViewed(false);
                log.setDopamineScore(0);
                log.setFocusPct(100);
                toSave.add(log);
            }
            cursor = cursor.plusDays(1);
        }
        if (!toSave.isEmpty()) {
            logRepo.saveAll(toSave);
        }

        NoFapStatusDTO newStatus = getStatus(playerId);
        checkAndAwardMilestoneXp(playerId, oldStreak, newStatus.getCurrentStreak());
        return newStatus;
    }

    public NoFapStatusDTO getStatus(Long playerId) {
        List<DopamineLog> allLogs = logRepo.findByPlayerIdOrderByLogDateDesc(playerId);

        LocalDate today = LocalDate.now();
        DopamineLog todayLog = allLogs.stream()
            .filter(l -> l.getLogDate().equals(today))
            .findFirst().orElse(null);

        LocalDate streakStart = today;
        if (todayLog != null && todayLog.isPornViewed()) {
            streakStart = today;
        } else if (!allLogs.isEmpty()) {
            for (DopamineLog log : allLogs) {
                if (log.isPornViewed()) {
                    streakStart = log.getLogDate().plusDays(1);
                    if (streakStart.isAfter(today)) {
                        streakStart = today;
                    }
                    break;
                }
                streakStart = log.getLogDate();
            }
        }

        long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(streakStart, today);
        int currentStreak = (int) daysBetween + (todayLog != null && !todayLog.isPornViewed() ? 1 : 0);

        int longestStreak = computeLongestStreak(allLogs);

        boolean todayConfirmed = todayLog != null;
        boolean todayClean = todayLog == null || !todayLog.isPornViewed(); // no record = streak intact

        NoFapStatusDTO dto = new NoFapStatusDTO();
        dto.setCurrentStreak(currentStreak);
        dto.setLongestStreak(longestStreak);
        dto.setTodayClean(todayClean);
        dto.setTodayConfirmed(todayConfirmed);

        // Milestone
        int milestone = milestone(currentStreak);
        int nextMilestone = nextMilestone(currentStreak);
        dto.setMilestone(milestone);
        dto.setNextMilestone(nextMilestone);
        dto.setDaysToNextMilestone(nextMilestone - currentStreak);

        // Phase
        PhaseInfo phase = phaseFor(currentStreak);
        dto.setPhaseName(phase.name);
        dto.setPhaseIcon(phase.icon);
        dto.setPhaseColor(phase.color);

        // Today's science
        ScienceDayCard todayCard = scienceCardForDay(currentStreak);
        dto.setScienceTitle(todayCard.getTitle());
        dto.setScienceFact(todayCard.getDescription());
        dto.setScienceCategory(todayCard.getCategory());

        // Full 90-day science timeline
        dto.setDayByDayScience(buildFullScienceTimeline());

        // Addiction insights
        dto.setAddictionInsights(buildAddictionInsights());

        // World stats
        dto.setWorldStats(worldStats());

        // XP bonus: 1% per clean day, capped at 50%.
        dto.setXpBonusPct(Math.min(50.0, currentStreak * 1.0));

        // System verdict
        dto.setSystemVerdict(systemVerdict(currentStreak));

        // Daily motivational quote
        String[] quote = getDailyQuote(currentStreak);
        dto.setDailyQuote(quote[0]);
        dto.setDailyQuoteAuthor(quote[1]);

        // Recovery velocity (global avg relapse day = 5; 100 = on par, >100 = faster)
        dto.setRecoveryVelocity(computeRecoveryVelocity(currentStreak));

        // Phase title
        dto.setPhaseTitle(getPhaseTitle(currentStreak));

        // Start date
        dto.setStartDate(streakStart.toString());

        // 90-day heatmap
        List<Boolean> heatmap = new ArrayList<>();
        Map<LocalDate, DopamineLog> byDate = allLogs.stream().collect(Collectors.toMap(DopamineLog::getLogDate, l -> l));
        for (int i = 89; i >= 0; i--) {
            LocalDate d = LocalDate.now().minusDays(i);
            DopamineLog log = byDate.get(d);
            if (log == null) {
                heatmap.add(null);
            } else {
                heatmap.add(!log.isPornViewed());
            }
        }
        dto.setLast90Days(heatmap);

        return dto;
    }

    @Transactional
    public NoFapStatusDTO confirmCleanDay(Long playerId) {
        int oldStreak = getStatus(playerId).getCurrentStreak();
        upsertPornViewed(playerId, false);
        NoFapStatusDTO newStatus = getStatus(playerId);
        checkAndAwardMilestoneXp(playerId, oldStreak, newStatus.getCurrentStreak());
        return newStatus;
    }

    @Transactional
    public Map<String, Object> logNightfall(Long playerId) {
        // Award a small amount of XP for tracking health
        playerRepo.findById(playerId).ifPresent(p -> {
            levelService.addXp(p, 10, "Logged health data (Nightfall)");
            playerRepo.save(p);
        });
        return Map.of(
            "message", "Nightfall logged. This is a natural healing process. Your streak remains intact. Keep going, Hunter.",
            "xpAwarded", 10
        );
    }

    @Transactional
    public NoFapStatusDTO reportRelapse(Long playerId) {
        upsertPornViewed(playerId, true);
        aiMemoryService.addImmediateMemory(playerId, "DECLINE", "Relapsed on NoFap Challenge today. Lost streak.");
        return getStatus(playerId);
    }

    @Transactional
    public Map<String, Object> urgeSurvived(Long playerId) {
        Player player = playerRepo.findById(playerId)
                .orElseThrow(() -> new IllegalArgumentException("Player not found"));
        
        // Award willpower XP for surfing the urge
        levelService.addXp(player, 20, "NOFAP_URGE_SURVIVED");
        
        return Map.of(
            "status", "survived",
            "xpAwarded", 20,
            "message", "Urge defeated. Willpower strengthened."
        );
    }

    // ────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ────────────────────────────────────────────────────────────────────────

    private void upsertPornViewed(Long playerId, boolean pornViewed) {
        DopamineLog log = logRepo.findByPlayerIdAndLogDate(playerId, LocalDate.now())
                .orElseGet(() -> {
                    DopamineLog n = new DopamineLog();
                    n.setPlayerId(playerId);
                    n.setLogDate(LocalDate.now());
                    n.setDopamineScore(0);
                    n.setFocusPct(100);
                    return n;
                });
        log.setPornViewed(pornViewed);
        logRepo.saveAndFlush(log);
    }

    private void checkAndAwardMilestoneXp(Long playerId, int oldStreak, int newStreak) {
        if (oldStreak == newStreak || newStreak < 7) return;
        
        Player player = playerRepo.findById(playerId).orElse(null);
        if (player == null) return;
        
        // We only award XP if the *new* streak crossed a milestone boundary that the old streak had not.
        if (oldStreak < 7 && newStreak >= 7) {
            levelService.addXp(player, 500, "NOFAP_MILESTONE_7");
        }
        if (oldStreak < 30 && newStreak >= 30) {
            levelService.addXp(player, 2000, "NOFAP_MILESTONE_30");
        }
        if (oldStreak < 90 && newStreak >= 90) {
            levelService.addXp(player, 5000, "NOFAP_MILESTONE_90");
        }
        if (oldStreak < 365 && newStreak >= 365) {
            levelService.addXp(player, 15000, "NOFAP_MILESTONE_365");
        }
    }

    private int computeLongestStreak(List<DopamineLog> all) {
        if (all == null || all.isEmpty()) return 0;
        
        // Sort ascending
        List<DopamineLog> sorted = new ArrayList<>(all);
        sorted.sort(Comparator.comparing(DopamineLog::getLogDate));
        
        int longest = 0, current = 0;
        LocalDate lastDate = null;
        
        for (DopamineLog log : sorted) {
            if (log.isPornViewed()) {
                current = 0;
                lastDate = null;
                continue;
            }
            
            // Clean day
            if (lastDate == null) {
                current = 1;
            } else {
                long gap = java.time.temporal.ChronoUnit.DAYS.between(lastDate, log.getLogDate());
                // Unlogged days are treated as clean, so add the gap
                current += gap;
            }
            lastDate = log.getLogDate();
            longest = Math.max(longest, current);
        }
        return longest;
    }

    private int milestone(int streak) {
        if (streak >= 365) return 365;
        if (streak >= 90) return 90;
        if (streak >= 30) return 30;
        if (streak >= 7) return 7;
        return 0;
    }

    private int nextMilestone(int streak) {
        if (streak < 7) return 7;
        if (streak < 30) return 30;
        if (streak < 90) return 90;
        if (streak < 365) return 365;
        return 365;
    }

    private record PhaseInfo(String name, String icon, String color) {}

    private PhaseInfo phaseFor(int streak) {
        if (streak >= 90) return new PhaseInfo("Mastery", "👑", "#A855F7");
        if (streak >= 30) return new PhaseInfo("Transformation", "🔥", "#1FBE8E");
        if (streak >= 7)  return new PhaseInfo("Clarity", "⚡", "#FAC775");
        return new PhaseInfo("Rewiring", "🧠", "#E24B4A");
    }

    private String systemVerdict(int streak) {
        if (streak == 0) return "◈ Day 0. The battle begins now. Every hour clean is a victory.";
        if (streak == 1) return "◈ Day 1. You survived Day 1. That alone puts you ahead of millions.";
        if (streak == 2) return "◈ Day 2. Dopamine is recalibrating. Stay offline. Stay sharp.";
        if (streak == 3) return "◈ Day 3. The first wall. Push through — it fades after today.";
        if (streak == 4) return "◈ Day 4. Your brain craves the old pattern. Deny it. Rewire.";
        if (streak == 5) return "◈ Day 5. Most people fail here. Not you. You're still standing.";
        if (streak == 6) return "◈ Day 6. One day from Week 1. Your prefrontal cortex is waking up.";
        if (streak == 7) return "◈ Day 7. ONE WEEK. Testosterone peaked today. First milestone unlocked.";
        if (streak < 14) return "◈ Day " + streak + ". Brain fog is lifting. Focus is returning. Keep going.";
        if (streak == 14) return "◈ Day 14. TWO WEEKS. Memory pathways strengthening every night.";
        if (streak < 21) return "◈ Day " + streak + ". You are in the top 30% globally. The rewiring is real.";
        if (streak == 21) return "◈ Day 21. THREE WEEKS. Male energy surge. You are a different person.";
        if (streak < 30) return "◈ Day " + streak + ". Momentum is building. The old you is fading fast.";
        if (streak == 30) return "◈ Day 30. ONE MONTH. Top 15% globally. Deep focus is now your default.";
        if (streak < 45) return "◈ Day " + streak + ". Your brain is rebuilding itself at the cellular level.";
        if (streak == 45) return "◈ Day 45. Social confidence is fully restored. You radiate presence.";
        if (streak < 60) return "◈ Day " + streak + ". You're in elite territory. The battle is almost won.";
        if (streak == 60) return "◈ Day 60. TWO MONTHS. Neural pathways are deeply healing. Stay the course.";
        if (streak < 75) return "◈ Day " + streak + ". Emotional stability locked. The highs and lows are gone.";
        if (streak == 75) return "◈ Day 75. Hormonal balance complete. You are operating at peak biology.";
        if (streak < 90) return "◈ Day " + streak + ". Final stretch. The 3% await. Don't stop now.";
        if (streak == 90) return "◈ Day 90. FULL REBOOT COMPLETE. Shadow Monarch discipline achieved.";
        return "◈ Day " + streak + ". Beyond 90. You are no longer fighting addiction — you have WON.";
    }

    // ────────────────────────────────────────────────────────────────────────
    // Science content (embedded — no DB needed)
    // ────────────────────────────────────────────────────────────────────────

    private ScienceDayCard scienceCardForDay(int day) {
        List<ScienceDayCard> timeline = buildFullScienceTimeline();
        // Find the card closest to (but not exceeding) current day
        ScienceDayCard best = timeline.get(0);
        for (ScienceDayCard c : timeline) {
            if (c.getDay() <= day) best = c;
        }
        return best;
    }

    private List<ScienceDayCard> buildFullScienceTimeline() {
        List<ScienceDayCard> cards = new ArrayList<>();

        // ── REWIRING PHASE: Days 0–6 ──────────────────────────────────────────
        cards.add(new ScienceDayCard(0,  "REWIRING", "🔴", "Day 0 — The Starting Line",
            "Your brain's reward system is used to being overstimulated. The healing begins now. Expect strong urges in the first few days — this is completely normal when breaking a dopamine-heavy habit.", "DOPAMINE"));
        cards.add(new ScienceDayCard(1,  "REWIRING", "🧠", "Day 1 — The Struggle Begins",
            "Your brain is realizing it's not getting its usual dopamine spike. You may feel tired, irritable, or foggy. This is withdrawal — your neurons are starting to rebalance. Stay offline. Breathe.", "DOPAMINE"));
        cards.add(new ScienceDayCard(2,  "REWIRING", "🌡️", "Day 2 — Withdrawal Intensifies",
            "Day 2 is often reported as harder than Day 1. The brain is actively searching for its old reward. Restlessness, anxiety, and low mood are common. Cold shower + exercise are your best weapons today.", "DOPAMINE"));
        cards.add(new ScienceDayCard(3,  "REWIRING", "⚡", "Day 3 — The Flatline Hits",
            "Around Day 3, many feel an emotional 'flatline' — numb, bored, low energy. This is your brain recalibrating after overstimulation. It feels like nothing, but everything is happening under the surface.", "DOPAMINE"));
        cards.add(new ScienceDayCard(4,  "REWIRING", "🔄", "Day 4 — Neural Rewiring Begins",
            "Your prefrontal cortex (the rational, decision-making part of your brain) is starting to regain control from the limbic system. You may catch yourself craving out of habit, not actual desire.", "DOPAMINE"));
        cards.add(new ScienceDayCard(5,  "REWIRING", "💤", "Day 5 — Sleep Starts Improving",
            "Without the heavy energy crash from relapsing, your sleep architecture is starting to normalize. REM sleep deepens, and many report their first vivid dreams around this time. Sleep is where the healing happens.", "SLEEP"));
        cards.add(new ScienceDayCard(6,  "REWIRING", "🌅", "Day 6 — Morning Energy Returns",
            "Cortisol (your natural morning hormone) is starting to peak at the right time again. You may notice waking up without that heavy, drained feeling. Energy in the morning is your sign the reset is working.", "TESTOSTERONE"));

        // ── REWIRING PHASE: Days 7–13 ─────────────────────────────────────────
        cards.add(new ScienceDayCard(7,  "REWIRING", "🔋", "Day 7 — Week 1 Complete · T-Spike",
            "A landmark study (Jiang, 2003) found serum testosterone peaks on Day 7 of abstinence. Your brain is also beginning to enjoy normal things again — food, music, and conversation feel richer. First milestone cleared.", "TESTOSTERONE"));
        cards.add(new ScienceDayCard(8,  "REWIRING", "🎵", "Day 8 — Emotional Sensitivity Returns",
            "Music hits differently. Colors feel more vivid. This is your dopamine receptors upregulating — they are becoming more sensitive to natural rewards after being numbed by overstimulation. This is progress.", "DOPAMINE"));
        cards.add(new ScienceDayCard(9,  "REWIRING", "🏋️", "Day 9 — Physical Drive Increases",
            "Testosterone and adrenaline are both finding natural balance. You may feel a noticeable drive to exercise, compete, or build something. Channel this physical energy — don't waste it.", "TESTOSTERONE"));
        cards.add(new ScienceDayCard(10, "REWIRING", "🎯", "Day 10 — Focus Returns",
            "The prefrontal cortex is getting stronger. You will notice it's easier to sit with difficult tasks without immediately seeking distraction. Your attention span is measurably improving this week.", "FOCUS"));
        cards.add(new ScienceDayCard(11, "REWIRING", "🧩", "Day 11 — Problem-Solving Sharpens",
            "Convergent thinking (logical problem-solving) improves as dopamine baseline normalizes. You may find yourself solving problems at work or code with more clarity and patience.", "FOCUS"));
        cards.add(new ScienceDayCard(12, "REWIRING", "💬", "Day 12 — Words Flow Easier",
            "Many report improved verbal fluency and social wit around this day. The part of your brain used for language and social processing is no longer competing with constant urge-management.", "CONFIDENCE"));
        cards.add(new ScienceDayCard(13, "REWIRING", "🌙", "Day 13 — Night Craving Peak",
            "Nighttime urges are often strongest in Week 2. Your brain associates night with the old habit. Keep your phone out of reach before bed, practice 4-7-8 breathing, and you will wake up proud.", "DOPAMINE"));

        // ── CLARITY PHASE: Days 14–29 ─────────────────────────────────────────
        cards.add(new ScienceDayCard(14, "CLARITY", "📚", "Day 14 — Memory Sharpens",
            "Two weeks clean. The hippocampus (your brain's memory center) is recovering. You may notice it's easier to retain information, recall names and details, and learn new skills. Your brain is rebuilding.", "MEMORY"));
        cards.add(new ScienceDayCard(15, "CLARITY", "🧘", "Day 15 — Anxiety Decreasing",
            "The amygdala (brain's fear center) is calming down as cortisol levels normalize. Social anxiety, the feeling of being 'watched', and the need to hide yourself begin to fade. Breathe. You are safe.", "CONFIDENCE"));
        cards.add(new ScienceDayCard(16, "CLARITY", "😤", "Day 16 — Eye Contact Gets Easy",
            "Oxytocin (the bonding hormone) is recovering. You might notice it's natural to hold eye contact, smile genuinely, and actually want to talk to people. Social interactions feel less draining.", "CONFIDENCE"));
        cards.add(new ScienceDayCard(17, "CLARITY", "📝", "Day 17 — Writing & Ideas Flow",
            "Divergent thinking (creative idea generation) picks up. Many report journaling, writing, or brainstorming more effortlessly. The brain freed from constant urge-management has bandwidth for creativity.", "FOCUS"));
        cards.add(new ScienceDayCard(18, "CLARITY", "⚖️", "Day 18 — Emotional Balance",
            "The dopamine-serotonin balance in your brain is stabilizing. The wild emotional swings of the first two weeks are beginning to smooth out. You feel more 'yourself' — calmer and more grounded.", "DOPAMINE"));
        cards.add(new ScienceDayCard(19, "CLARITY", "🏃", "Day 19 — Stamina Builds",
            "Physical endurance and recovery are improving alongside mental clarity. The prolactin (post-relapse fatigue hormone) that used to drain your energy is no longer spiking. Your body is reclaiming its power.", "TESTOSTERONE"));
        cards.add(new ScienceDayCard(20, "CLARITY", "🎙️", "Day 20 — Vocal Presence Strengthens",
            "Higher testosterone correlates with a deeper, more resonant voice and increased assertiveness. People around you begin sensing a shift in your presence, even if they cannot name it.", "TESTOSTERONE"));
        cards.add(new ScienceDayCard(21, "CLARITY", "💪", "Day 21 — Three Weeks · Energy Surge",
            "Three-week milestone. Community data shows the biggest energy and confidence boost occurs between Day 21–25. Testosterone is stable, dopamine is balanced, and your identity is shifting. Use this energy NOW.", "TESTOSTERONE"));
        cards.add(new ScienceDayCard(22, "CLARITY", "🌊", "Day 22 — Urges Become Manageable",
            "The urges don't disappear, but their intensity drops significantly after Day 21. Your brain is adapting. You now recognize urges as just passing thoughts, not commands. You have choice.", "DOPAMINE"));
        cards.add(new ScienceDayCard(23, "CLARITY", "🔬", "Day 23 — Brain Cells Regenerating",
            "Neurogenesis (the creation of new brain cells) is measurably higher during periods of healthy lifestyle. Exercise, sleep, and abstinence together are literally growing new neural connections in your hippocampus.", "NEUROPLASTICITY"));
        cards.add(new ScienceDayCard(24, "CLARITY", "💡", "Day 24 — Ideas Hit Different",
            "Dopamine baseline being balanced means rewards feel proportionate. When you solve a problem or finish a task, the satisfaction is genuine and sustained — not hollow like after a relapse.", "DOPAMINE"));
        cards.add(new ScienceDayCard(25, "CLARITY", "🔥", "Day 25 — The Aura",
            "People in your life notice a change in your energy and presence. This is what the community calls 'the aura'. It is the result of better eye contact, voice, posture, and genuine confidence — all measurable outcomes.", "CONFIDENCE"));
        cards.add(new ScienceDayCard(26, "CLARITY", "🤝", "Day 26 — Social Magnetism",
            "Social interactions that felt draining now feel energizing. The shame that made you want to hide is fading. Friendships deepen, and you may find yourself in more meaningful conversations.", "CONFIDENCE"));
        cards.add(new ScienceDayCard(27, "CLARITY", "🎓", "Day 27 — Learning Accelerates",
            "Your brain's neuroplasticity is at a high point. Skills you practice now — coding, languages, music — will be encoded more efficiently. This is the ideal time to begin or intensify a learning habit.", "MEMORY"));
        cards.add(new ScienceDayCard(28, "CLARITY", "🌓", "Day 28 — Four Weeks Threshold",
            "Brain imaging studies show that at the 4-week mark, the prefrontal cortex activity levels in recovering addicts begin to match those of non-addicted individuals. Your rational mind is reclaiming control.", "NEUROPLASTICITY"));
        cards.add(new ScienceDayCard(29, "CLARITY", "🌐", "Day 29 — Big Picture Thinking",
            "Strategic, long-term thinking improves as your prefrontal cortex strengthens. You now naturally think about goals, consequences, and future outcomes instead of just instant gratification.", "FOCUS"));

        // ── TRANSFORMATION PHASE: Days 30–59 ─────────────────────────────────
        cards.add(new ScienceDayCard(30, "TRANSFORMATION", "🌊", "Day 30 — One Month · Deep Focus",
            "One month. Top 15% globally. Your brain is no longer constantly seeking a quick hit. It now defaults to creative thinking and deep problem-solving. Hard, meaningful work now feels natural and even enjoyable.", "FOCUS"));
        cards.add(new ScienceDayCard(31, "TRANSFORMATION", "🏆", "Day 31 — Discipline as Identity",
            "You are no longer fighting the habit as an outsider — you are becoming someone who does not do this. Identity-based change is the most durable. You are building a new self, not just resisting an old one.", "CONFIDENCE"));
        cards.add(new ScienceDayCard(32, "TRANSFORMATION", "⏱️", "Day 32 — Time Reclaimed",
            "Hours previously lost to the habit are now available. Many report filling this time with exercise, side projects, and social connections. The compound interest of reclaimed time is becoming visible.", "FOCUS"));
        cards.add(new ScienceDayCard(33, "TRANSFORMATION", "🔭", "Day 33 — Future-Oriented Mind",
            "Research shows that higher dopamine baseline correlates with better delay of gratification — the ability to sacrifice short-term pleasure for long-term gain. Your financial, career, and fitness decisions are improving.", "DOPAMINE"));
        cards.add(new ScienceDayCard(34, "TRANSFORMATION", "🏊", "Day 34 — Physical Recovery Peaks",
            "Athletes who abstain report measurable improvements in grip strength, cardiovascular endurance, and muscle recovery speed. Your physical body and your mental game are now working together.", "TESTOSTERONE"));
        cards.add(new ScienceDayCard(35, "TRANSFORMATION", "🧲", "Day 35 — Five Weeks · Magnetic Presence",
            "Five weeks. The combination of recovered eye contact, stable hormones, clear skin (linked to lower DHT from over-masturbation), and genuine confidence creates an undeniable shift in your social presence.", "CONFIDENCE"));
        cards.add(new ScienceDayCard(36, "TRANSFORMATION", "🎨", "Day 36 — Creativity Surge",
            "Excess dopaminergic energy that your brain is no longer directing toward the old habit now flows into creative work. Writers write. Coders code. Musicians compose. Channel this energy into something real.", "FOCUS"));
        cards.add(new ScienceDayCard(37, "TRANSFORMATION", "💎", "Day 37 — Character Solidifies",
            "You have now experienced urges, flatlines, temptation, and you resisted all of it. That repeated choice is building what psychologists call 'ego strength' — the capacity to do hard things. This transfers to every area of life.", "CONFIDENCE"));
        cards.add(new ScienceDayCard(38, "TRANSFORMATION", "📡", "Day 38 — Reading People Better",
            "Your mirror neuron system (empathy circuitry) works better when not oversaturated by artificial stimulation. You notice more emotional subtleties in conversations — tone, body language, real meaning.", "CONFIDENCE"));
        cards.add(new ScienceDayCard(39, "TRANSFORMATION", "🌱", "Day 39 — Habit Replacement Locked In",
            "Research shows it takes 21-66 days to form a new habit. Any healthy replacement habit you started (exercise, cold showers, reading) is now becoming automatic. Your new neural groove is deeper than the old one.", "NEUROPLASTICITY"));
        cards.add(new ScienceDayCard(40, "TRANSFORMATION", "🎯", "Day 40 — Flow States Appear",
            "Flow state — the mental state of complete, effortless absorption in a task — becomes accessible again. When dopamine is balanced, the brain can enter focus states that last hours without distraction.", "FOCUS"));
        cards.add(new ScienceDayCard(41, "TRANSFORMATION", "🔋", "Day 41 — Sustained Energy",
            "No more midday crashes. The prolactin-induced fatigue cycle is broken. Your energy is now smooth and sustained throughout the day rather than peaking artificially and crashing hard.", "TESTOSTERONE"));
        cards.add(new ScienceDayCard(42, "TRANSFORMATION", "🌍", "Day 42 — Six Weeks · Global Minority",
            "Six weeks. You are now in the top 10% of all people who attempt this challenge globally. Most gave up in Week 1. You are proof that willpower, practiced daily, becomes a superpower.", "CONFIDENCE"));
        cards.add(new ScienceDayCard(43, "TRANSFORMATION", "🧩", "Day 43 — Complex Tasks Get Easier",
            "Executive function — planning, organizing, and executing complex tasks — continues to improve. Work projects, study sessions, and long-term goals feel more achievable.", "FOCUS"));
        cards.add(new ScienceDayCard(44, "TRANSFORMATION", "🤗", "Day 44 — Real Intimacy Returns",
            "Oxytocin pathways are now fully recovering. The capacity to feel genuine love, affection, and deep connection — not just lust — is returning. Real relationships become more meaningful.", "CONFIDENCE"));
        cards.add(new ScienceDayCard(45, "TRANSFORMATION", "👥", "Day 45 — Social Fear Eliminated",
            "Social anxiety linked to shame and self-disgust is largely gone by this point. Eye contact, public speaking, and social initiation happen naturally and without internal friction. You are present.", "CONFIDENCE"));
        cards.add(new ScienceDayCard(46, "TRANSFORMATION", "🧠", "Day 46 — Prefrontal Cortex Healed",
            "Neuroscience studies on behavioral addictions show the prefrontal cortex (decision-making, impulse control) shows measurable structural recovery around 6 weeks. Your logic center is rebuilt.", "NEUROPLASTICITY"));
        cards.add(new ScienceDayCard(47, "TRANSFORMATION", "🌙", "Day 47 — Dream Quality Peaks",
            "Deep, vivid, restorative REM sleep is now consistent. Your brain consolidates memories and emotional processing during REM. Waking up clear and refreshed is now the norm, not the exception.", "SLEEP"));
        cards.add(new ScienceDayCard(48, "TRANSFORMATION", "💬", "Day 48 — Genuine Humor Returns",
            "Wit, spontaneous humor, and playful social energy return when the prefrontal cortex is healthy. Conversations feel alive again. You are less in your head and more in the moment.", "CONFIDENCE"));
        cards.add(new ScienceDayCard(49, "TRANSFORMATION", "⚡", "Day 49 — Seven Weeks · Alpha Energy",
            "Seven weeks. The internal shift is becoming undeniable. The passive, avoidant version of yourself is gone. You take up space. You make eye contact. You say what you mean. This is you at your baseline.", "TESTOSTERONE"));
        cards.add(new ScienceDayCard(50, "TRANSFORMATION", "🏅", "Day 50 — Halfway to Elite",
            "Day 50. Half of 90 days done. Only 5% of all who start ever reach this point. The data from recovery communities shows your risk of relapse has dropped by over 60% compared to Day 1.", "CONFIDENCE"));
        cards.add(new ScienceDayCard(51, "TRANSFORMATION", "📈", "Day 51 — Productivity Measurable",
            "Community surveys of 30+ day streaks report an average 34% increase in daily task completion. Your output at work, gym, and personal projects is objectively higher than before you began.", "FOCUS"));
        cards.add(new ScienceDayCard(52, "TRANSFORMATION", "🌟", "Day 52 — Self-Respect Rebuilt",
            "Self-esteem built from kept promises to yourself is more durable than any external validation. Every day you have kept your word to yourself. That is the foundation of authentic confidence.", "CONFIDENCE"));
        cards.add(new ScienceDayCard(53, "TRANSFORMATION", "🧬", "Day 53 — Gene Expression Changes",
            "Epigenetic research shows sustained lifestyle changes begin altering gene expression patterns. Your body's stress response, immune function, and cellular repair are improving at a biological level.", "NEUROPLASTICITY"));
        cards.add(new ScienceDayCard(54, "TRANSFORMATION", "🎙️", "Day 54 — Voice of Conviction",
            "When you speak from a place of genuine self-respect, your voice, posture, and word choice project authority. This isn't performance — it's the natural output of a brain no longer suppressed by shame.", "CONFIDENCE"));
        cards.add(new ScienceDayCard(55, "TRANSFORMATION", "🔐", "Day 55 — Triggers Weaken",
            "The neural triggers that used to automatically activate craving (certain times, places, emotions) are losing their grip. You can now notice a trigger as an external stimulus without becoming enslaved by it.", "DOPAMINE"));
        cards.add(new ScienceDayCard(56, "TRANSFORMATION", "🌈", "Day 56 — Eight Weeks · Visual Clarity",
            "Eight weeks. Many report the world literally looking brighter, more colorful, and more beautiful. This is your dopamine reward system appreciating real stimuli at full sensitivity again.", "DOPAMINE"));
        cards.add(new ScienceDayCard(57, "TRANSFORMATION", "🏃", "Day 57 — Athletic Performance Up",
            "Without the hormonal disruption of relapsing, recovery between workouts is faster and muscle gains are more consistent. Your testosterone is building muscle, not being squandered.", "TESTOSTERONE"));
        cards.add(new ScienceDayCard(58, "TRANSFORMATION", "🤲", "Day 58 — Generosity Grows",
            "Abundance mindset replaces scarcity thinking. When you are no longer trapped in a shame-reward cycle, you naturally become more generous, helpful, and patient with others.", "CONFIDENCE"));
        cards.add(new ScienceDayCard(59, "TRANSFORMATION", "🌄", "Day 59 — Final Transformation Day",
            "Tomorrow is Day 60. Two months. You are about to enter the upper tier of recovery. The person who started Day 0 would not recognize the clarity, energy, and discipline you now carry.", "NEUROPLASTICITY"));

        // ── TRANSFORMATION → MASTERY: Days 60–89 ─────────────────────────────
        cards.add(new ScienceDayCard(60, "TRANSFORMATION", "🧬", "Day 60 — Two Months · Brain Healing",
            "Two months of clean living. Structural brain healing is measurable — the white matter integrity of neural pathways is recovering, especially in areas tied to impulse control and emotional regulation.", "NEUROPLASTICITY"));
        cards.add(new ScienceDayCard(61, "TRANSFORMATION", "🔭", "Day 61 — Long-Game Thinking",
            "Short-term thinking dominated your old pattern. Now, you naturally delay gratification, plan ahead, and make decisions based on who you want to become — not just what feels good in the moment.", "FOCUS"));
        cards.add(new ScienceDayCard(62, "TRANSFORMATION", "💪", "Day 62 — Physical Peak Alignment",
            "Testosterone, growth hormone, and cortisol are now in their healthiest natural rhythm. Your body's recovery, strength, and sexual health are operating at factory settings — clean and powerful.", "TESTOSTERONE"));
        cards.add(new ScienceDayCard(63, "TRANSFORMATION", "🎓", "Day 63 — Nine Weeks · Master Learner",
            "Nine weeks. Your hippocampus (memory and learning center) has had over two months of improved sleep, stable hormones, and reduced cortisol. You are at the best cognitive state you've been in years.", "MEMORY"));
        cards.add(new ScienceDayCard(64, "TRANSFORMATION", "🔒", "Day 64 — Relapse Risk Lowest",
            "Studies on habit reversal show that the risk of full relapse drops exponentially with time. At Day 64, you are in the lowest risk window of your recovery. Your new habit is stronger than the old one.", "DOPAMINE"));
        cards.add(new ScienceDayCard(65, "TRANSFORMATION", "🌊", "Day 65 — Calm Under Pressure",
            "Your stress response system is now calibrated. Where small frustrations once triggered urges, you now respond to stress with clarity and problem-solving rather than escape-seeking.", "CONFIDENCE"));
        cards.add(new ScienceDayCard(66, "TRANSFORMATION", "🛡️", "Day 66 — Habit Fully Cemented",
            "Research by UCL psychologist Phillippa Lally confirms the average habit formation time is 66 days. Your new identity — a man who does not watch porn — is now neurologically hardwired.", "NEUROPLASTICITY"));
        cards.add(new ScienceDayCard(67, "TRANSFORMATION", "🎯", "Day 67 — Precision Focus",
            "Your ability to ignore irrelevant stimuli and maintain task focus is now significantly above baseline. This is measurable in reaction time, work quality, and the depth of your thinking.", "FOCUS"));
        cards.add(new ScienceDayCard(68, "TRANSFORMATION", "🤝", "Day 68 — Deep Connection",
            "Relationships that exist now — built on authentic presence rather than shame-driven withdrawal — are your strongest ever. You show up fully for people because you are no longer hiding a part of yourself.", "CONFIDENCE"));
        cards.add(new ScienceDayCard(69, "TRANSFORMATION", "🧘", "Day 69 — Mind-Body Sync",
            "Your mental state and physical state are now aligned. When you feel good mentally, your body reflects it. When you train physically, your mind benefits. This feedback loop is the foundation of peak performance.", "TESTOSTERONE"));
        cards.add(new ScienceDayCard(70, "TRANSFORMATION", "🔋", "Day 70 — Ten Weeks · Full Battery",
            "Ten weeks of recovery. Your energy is not bursts of motivation followed by crashes — it is a steady, reliable current. You get things done consistently, not just when you feel inspired.", "TESTOSTERONE"));
        cards.add(new ScienceDayCard(71, "TRANSFORMATION", "📸", "Day 71 — Photographic Recall",
            "Your working memory capacity has increased significantly. Information you read, hear, or study is encoded faster and recalled more accurately. Your brain is genuinely sharper than it was 71 days ago.", "MEMORY"));
        cards.add(new ScienceDayCard(72, "TRANSFORMATION", "🌍", "Day 72 — Top 5% Globally",
            "You are now in the top 5% of all people who ever attempt a NoFap challenge. Most never make it past Day 30. You have done something that millions of men across the world have failed to do.", "CONFIDENCE"));
        cards.add(new ScienceDayCard(73, "TRANSFORMATION", "🏗️", "Day 73 — Building the Future",
            "The time, money, and mental energy once consumed by the habit is now compounding into your real life. Your career, fitness, and finances are objectively improving as a direct result of this discipline.", "FOCUS"));
        cards.add(new ScienceDayCard(74, "TRANSFORMATION", "💎", "Day 74 — Diamond Mindset",
            "Pressure forms diamonds. Every urge you resisted, every hard day you pushed through — all of it was applying pressure to turn your average mindset into something rare and strong.", "CONFIDENCE"));
        cards.add(new ScienceDayCard(75, "TRANSFORMATION", "⚙️", "Day 75 — Hormonal Mastery",
            "At Day 75, your endocrine system is operating in optimal balance. Testosterone, cortisol, dopamine, serotonin, and oxytocin are all at healthy levels simultaneously. This is hormonal mastery.", "TESTOSTERONE"));
        cards.add(new ScienceDayCard(76, "TRANSFORMATION", "🎭", "Day 76 — Authentic Self Emerges",
            "The persona you built to hide your shame is dissolving. What remains is the authentic version of you — direct, present, and unafraid. People are drawn to authenticity because it is so rare.", "CONFIDENCE"));
        cards.add(new ScienceDayCard(77, "TRANSFORMATION", "🌙", "Day 77 — Eleven Weeks · Deep Sleep Master",
            "Eleven weeks. Your sleep quality is at its peak. Deep sleep (Stage 3 and REM) occupies a larger portion of your night. Growth hormone peaks during deep sleep — you are literally rebuilding every night.", "SLEEP"));
        cards.add(new ScienceDayCard(78, "TRANSFORMATION", "🚀", "Day 78 — Momentum Unbreakable",
            "At this stage, your daily disciplines (exercise, sleep, focus) have merged into a single unstoppable momentum. The question is no longer 'if' you will succeed — it's how far you will go.", "FOCUS"));
        cards.add(new ScienceDayCard(79, "TRANSFORMATION", "🌺", "Day 79 — Sensitivity Restored",
            "Real-world beauty — a sunset, a good meal, a genuine laugh with a friend — now produces genuine pleasure. Your reward system is fully calibrated to appreciate actual life. This is what you were missing.", "DOPAMINE"));
        cards.add(new ScienceDayCard(80, "TRANSFORMATION", "🏰", "Day 80 — Inner Fortress Built",
            "The psychological resilience built over 80 days of resisting one of the strongest modern addictions is now armor for every other challenge in your life. Career setbacks, rejection, failure — you can handle it.", "CONFIDENCE"));
        cards.add(new ScienceDayCard(81, "TRANSFORMATION", "🎓", "Day 81 — Wisdom Compounds",
            "You understand your own brain now — what triggers you, what strengthens you, what depletes you. This self-knowledge is rare and powerful. You can now help others who are where you were on Day 0.", "MEMORY"));
        cards.add(new ScienceDayCard(82, "TRANSFORMATION", "⚡", "Day 82 — Twelve Weeks Minus One",
            "One week away from the ultimate milestone. Your brain has been in continuous recovery for over two and a half months. Every day has added another layer of healing. The finish line is visible.", "NEUROPLASTICITY"));
        cards.add(new ScienceDayCard(83, "TRANSFORMATION", "🌀", "Day 83 — Neural Superstructure",
            "The neural pathways you built by repeatedly choosing discipline over instant gratification are now thick, fast, and dominant. Choosing well has become your brain's default mode.", "NEUROPLASTICITY"));
        cards.add(new ScienceDayCard(84, "TRANSFORMATION", "🔱", "Day 84 — Twelve Weeks · Final Phase",
            "Twelve weeks. You have reshaped your brain's architecture. The scientific term for what you've achieved is 'activity-dependent plasticity' — your habits literally changed your brain's physical structure.", "NEUROPLASTICITY"));
        cards.add(new ScienceDayCard(85, "MASTERY", "🌟", "Day 85 — Entering Mastery Territory",
            "Five days from Day 90. You are now entering Mastery phase. The recovery community considers Day 85 the point where the neural reboot is functionally complete in most individuals.", "NEUROPLASTICITY"));
        cards.add(new ScienceDayCard(86, "MASTERY", "🛡️", "Day 86 — Immune System Stronger",
            "Research links chronic pornography use with elevated cortisol and suppressed immune function. At Day 86, your immune system is measurably stronger. You get sick less. You recover faster.", "TESTOSTERONE"));
        cards.add(new ScienceDayCard(87, "MASTERY", "🌈", "Day 87 — Life in High Definition",
            "Your senses are fully restored. Colors are vivid, music is emotional, human connection is genuine. This is life without a dopamine-numbing filter. Most people never experience this clarity.", "DOPAMINE"));
        cards.add(new ScienceDayCard(88, "MASTERY", "💡", "Day 88 — Cognitive Peak",
            "Two days away. Your working memory, pattern recognition, and creative problem-solving are all operating at their genuine biological potential — not the suppressed version from before Day 0.", "MEMORY"));
        cards.add(new ScienceDayCard(89, "MASTERY", "⏳", "Day 89 — One Day Away",
            "Tomorrow you achieve what only 3% of all challengers ever achieve. Every single choice of the past 89 days led here. Sleep. Rest. Tomorrow you claim your victory.", "CONFIDENCE"));

        // ── MASTERY: Day 90 ───────────────────────────────────────────────────
        cards.add(new ScienceDayCard(90, "MASTERY", "👑", "Day 90 — FULL NEUROLOGICAL REBOOT",
            "The ultimate milestone. Clinical research on behavioral addiction recovery consistently cites 90 days as the threshold for measurable structural brain recovery. You are in the global top 3%. You are no longer an addict. You are free.", "NEUROPLASTICITY"));

        return cards;
    }

    // ── New helper methods ────────────────────────────────────────────────────

    /**
     * Returns a [quote, author] pair matched to the current streak day.
     * 91 unique quotes (Days 0–90+), sourced from science, philosophy, and community success stories.
     */
    private String[] getDailyQuote(int streak) {
        String[][] quotes = {
            {"The secret of getting ahead is getting started.", "Mark Twain"},                                                    // 0
            {"You don't have to be great to start, but you have to start to be great.", "Zig Ziglar"},                           // 1
            {"Every moment of resistance to temptation is a victory.", "Frederick William Faber"},                                // 2
            {"The cave you fear to enter holds the treasure you seek.", "Joseph Campbell"},                                       // 3
            {"Do not pray for an easy life. Pray for the strength to endure a difficult one.", "Bruce Lee"},                      // 4
            {"I don't stop when I'm tired. I stop when I'm done.", "David Goggins"},                                             // 5
            {"One day or Day One. You decide.", "NoFap Community"},                                                              // 6
            {"Testosterone + discipline = transformation.", "Neuroscience Research, 2003"},                                      // 7
            {"The mind is everything. What you think you become.", "Buddha"},                                                     // 8
            {"Suffer now and live the rest of your life as a champion.", "Muhammad Ali"},                                         // 9
            {"Your future self is watching you right now through your memories.", "Aubrey de Grey"},                              // 10
            {"Focus is a matter of deciding what things you're NOT going to do.", "John Carmack"},                               // 11
            {"If you can control your mind, you can control your life.", "NoFap Community"},                                      // 12
            {"The night is always darkest before the dawn.", "Thomas Fuller"},                                                    // 13
            {"Two weeks. Your memory is already better than it was. Feel it.", "The System"},                                     // 14
            {"Anxiety is the fuel your old habit ran on. You're running on something better now.", "The System"},                // 15
            {"Discipline is the bridge between goals and accomplishment.", "Jim Rohn"},                                           // 16
            {"The pen is mightier than the sword — and your journal is your weapon.", "Edward Bulwer-Lytton"},                   // 17
            {"Between stimulus and response there is a space. In that space lies your freedom.", "Viktor Frankl"},               // 18
            {"Champions are made from something they have deep inside them — a desire, a dream, a vision.", "Muhammad Ali"},     // 19
            {"Speak with conviction. You have earned the right.", "The System"},                                                  // 20
            {"Three weeks. The testosterone data is real. Use this energy wisely.", "NoFap Science Report"},                     // 21
            {"An urge is just a thought. You are not your thoughts.", "CBT Principle"},                                          // 22
            {"Neurons that fire together, wire together. You are rewiring right now.", "Donald Hebb"},                           // 23
            {"Real satisfaction is earned, not downloaded.", "The System"},                                                       // 24
            {"The aura is not a myth. It is biology. It is you at baseline.", "NoFap Community"},                                // 25
            {"Loneliness is better than bad company.", "George Washington"},                                                      // 26
            {"Learning is not attained by chance; it must be sought with ardor and attended with diligence.", "Abigail Adams"},  // 27
            {"Your prefrontal cortex is recovering. The best version of your judgment is coming back online.", "The System"},    // 28
            {"A man who can see tomorrow better than today has a weapon.", "The System"},                                         // 29
            {"One month. The top 15% of all who try. Keep building.", "NoFap Community Data"},                                   // 30
            {"You are not the person who started Day 0. Act like it.", "The System"},                                            // 31
            {"What you do today is writing the chapter your future self will read.", "The System"},                              // 32
            {"The ability to delay gratification is the single most powerful skill in human psychology.", "Walter Mischel"},     // 33
            {"Your body is a temple. Stop letting it be treated like a 7-Eleven.", "The System"},                               // 34
            {"Five weeks. Your presence is magnetic now. People feel it even if they can't explain it.", "The System"},          // 35
            {"Creativity is intelligence having fun — and yours is back.", "Albert Einstein"},                                   // 36
            {"Character is what you are when no one is watching.", "John Wooden"},                                               // 37
            {"The quality of your attention determines the quality of your life.", "The System"},                                // 38
            {"Sixty-six days forms a new habit. You're almost there.", "UCL Research"},                                          // 39
            {"The flow state is your reward for clearing the noise.", "Mihaly Csikszentmihalyi"},                               // 40
            {"Energy is not given. It is cultivated. You are living proof.", "The System"},                                      // 41
            {"Six weeks. You are now the exception, not the rule.", "NoFap Community Data"},                                     // 42
            {"Complexity is just mastered simplicity, stacked.", "The System"},                                                  // 43
            {"Connection is why we are here. You can feel it again now.", "Brené Brown"},                                        // 44
            {"Fear is not real. It is the product of thoughts you create. Do not misunderstand me — danger is very real. But fear is a choice.", "Will Smith, After Earth"},  // 45
            {"Your prefrontal cortex has physically rebuilt itself. Welcome back, commander.", "The System"},                    // 46
            {"Dreams are not random. They are your healing brain making sense of the world.", "The System"},                    // 47
            {"A man who laughs easily is a man who is free.", "The System"},                                                     // 48
            {"Seven weeks. Alpha energy is not a myth — it's the biological result of what you've built.", "The System"},        // 49
            {"Day 50. Only 5% of challengers ever reach this moment. You are among them.", "NoFap Community Data"},             // 50
            {"Output is the loudest proof of recovery.", "The System"},                                                          // 51
            {"Self-respect is the root of discipline: The sense of dignity grows with the ability to say no.", "Abraham Joshua Heschel"},  // 52
            {"Your genes are listening to your lifestyle. Make them hear something worth listening to.", "Epigenetics Research"}, // 53
            {"When you speak, you speak from strength now. People can hear the difference.", "The System"},                      // 54
            {"The cage is not locked. You have been holding it shut. Let go.", "The System"},                                    // 55
            {"Eight weeks. The world is brighter. That's not poetic — that's dopamine science.", "The System"},                  // 56
            {"Train hard, recover fast. That's the man you are now.", "The System"},                                             // 57
            {"A generous man gives not from what he has left over, but from the strength he has built.", "The System"},          // 58
            {"Tomorrow is Day 60. You are about to enter a different league entirely.", "The System"},                           // 59
            {"Two months of healing. Your brain's architecture has changed. This is real.", "Neuroplasticity Research"},         // 60
            {"Long-game thinking is the only game worth playing.", "The System"},                                               // 61
            {"You are operating at factory settings. Clean, powerful, and fully yourself.", "The System"},                       // 62
            {"Nine weeks. Your hippocampus is learning at full capacity. Feed it.", "The System"},                               // 63
            {"You are now more likely to succeed than to relapse. That crossover just happened.", "Habit Research"},             // 64
            {"Under pressure, a diamond stays a diamond. You have proven this.", "The System"},                                  // 65
            {"Sixty-six days. Your new identity is neurologically cemented. This is who you are now.", "UCL Research"},         // 66
            {"Precision is the mark of a recovered mind. You have it now.", "The System"},                                       // 67
            {"Show up fully. That is your superpower now.", "The System"},                                                       // 68
            {"When mind and body are synchronized, nothing is out of reach.", "The System"},                                     // 69
            {"Ten weeks of clean, reliable energy. The people around you have noticed.", "The System"},                          // 70
            {"Your memory is a weapon now. Sharpen it.", "The System"},                                                          // 71
            {"Top 5% globally. This is not a small thing. This is exceptional.", "NoFap Community Data"},                        // 72
            {"Every hour of discipline today compounds into the future you want.", "The System"},                                // 73
            {"Pressure is a privilege — it means you're playing for something real.", "Billie Jean King"},                       // 74
            {"Hormonal mastery. You are running on clean fuel.", "The System"},                                                  // 75
            {"Authenticity is magnetic. You have stopped performing. You have started existing.", "The System"},                 // 76
            {"Eleven weeks. Deep sleep every night. Growth hormone rebuilding you in the dark.", "Sleep Science"},               // 77
            {"Momentum is not given. It is built one decision at a time. You have built it.", "The System"},                    // 78
            {"You are no longer looking for joy. You are generating it.", "The System"},                                         // 79
            {"Eighty days of building a fortress inside yourself. No addiction can tear it down.", "The System"},                // 80
            {"Self-knowledge is the beginning of all wisdom.", "Aristotle"},                                                     // 81
            {"Twelve weeks minus one. The last summit before the flag goes up.", "The System"},                                  // 82
            {"Every good decision rewrote your brain. Every rewiring got you closer to this.", "Neuroscience"},                  // 83
            {"Twelve weeks. Activity-dependent plasticity — your habits changed your brain's physical structure.", "Neuroscience"},  // 84
            {"You are entering Mastery. This phase is for people who refused to quit.", "The System"},                          // 85
            {"Your immune system has been strengthened by 85 days of reduced cortisol. You are healthier.", "Research"},        // 86
            {"Life in high definition. This is what you were meant to feel.", "The System"},                                     // 87
            {"Two days. Your cognitive peak is right now. Use it.", "The System"},                                               // 88
            {"One day away from the top 3%. Sleep. Rest. Tomorrow you claim your legacy.", "The System"},                        // 89
            {"Day 90. You did it. You are no longer fighting addiction — you have won.", "The System"},                          // 90+
        };
        int idx = Math.min(streak, quotes.length - 1);
        return quotes[idx];
    }

    /** Computes recovery velocity: currentStreak / globalAvgRelapsDay × 100. Average global relapse = Day 5. */
    private double computeRecoveryVelocity(int streak) {
        if (streak == 0) return 0.0;
        final double globalAvgRelapse = 5.0; // Community data: average person relapses on Day 5
        double velocity = (streak / globalAvgRelapse) * 100.0;
        return Math.min(2000.0, Math.round(velocity * 10.0) / 10.0);
    }

    /** Returns an unlockable title based on the current streak milestone. */
    private String getPhaseTitle(int streak) {
        if (streak >= 90)  return "Shadow Monarch";
        if (streak >= 60)  return "Brain Warrior";
        if (streak >= 45)  return "Clarity Seeker";
        if (streak >= 30)  return "Iron Will";
        if (streak >= 21)  return "Energy Awakened";
        if (streak >= 14)  return "Mind Sharpener";
        if (streak >= 7)   return "Week Warrior";
        if (streak >= 3)   return "Awakening Hunter";
        return "Day Zero Initiate";
    }

    private List<AddictionInsight> buildAddictionInsights() {
        List<AddictionInsight> insights = new ArrayList<>();

        // ===== BRAIN =====
        insights.add(new AddictionInsight("BRAIN", "\uD83E\uDDE0", "Brain Damage from Porn",
                "Scientists from JAMA Psychiatry (2014) discovered that men who regularly watch porn have less grey matter in their prefrontal cortex — the part of your brain that gives you willpower, focus, and self-control. Think of it like a muscle that shrinks when not used properly. When this brain area shrinks, you feel lazy, can't finish tasks, and can't control your urges. The more you watch, the more brain power you lose.",
                "JAMA Psychiatry (2014) scientists kandupidichanga — regularly porn paakura aanungalukku prefrontal cortex-la grey matter kuaiyirukkunu. Atha simple-a solla, unga brain-la willpower, decision-making ellam control panra part — atha unga daily porn use shrink pannudhu. Muscle use pannama vittaa shrink aagum, same maari. Antha part weak aagum pothu — neenga lazy aagreenga, important tasks thaLLi podringa, urges control panna mudiyala feel panreenga. Paakra quantity kooda kooda, damage kooda kooda aagudhu.",
                "CRITICAL"));

        insights.add(new AddictionInsight("BRAIN", "\uD83E\uDD2F", "The Dopamine Reward System Trap",
                "Neuroscientist Dr. William Struthers calls porn a 'supernormal stimulus' — it floods your brain with 10x more dopamine than any real activity. Because of this fake pleasure flood, your brain rewires itself to need that extreme hit. Normal life — a good meal, a friend's laugh, finishing a goal — starts feeling boring and flat. This is called 'anhedonia'. This is why addicts feel unmotivated and sad even when life looks fine from outside.",
                "Porn unga brain-ku real life-a vida 10x aadhikam dopamine kudukudhu. Ithu enna problem nu paartha — unga brain slowly rewire aagudhu, aadhikam aadhikam stimulation vennum nu feel pannum. Nalla saaptu saaptu kaatuSum, friend kooda pesuvathuvum — ellam flat-a, boring-a feel aakum. Indha condition peyar 'anhedonia'. Adhanala daily life-la onnume interesting-a theriyala, motivation zero, depressed-a feel panreenga — veliyela paakaRavanga 'nalla irukaan-la' solvanga, aana unga ulluku oru vacuum maari irukkum.",
                "CRITICAL"));

        insights.add(new AddictionInsight("BRAIN", "\uD83D\uDE30", "Chronic Anxiety and Stress",
                "Cambridge University researchers found that the amygdala — your brain's fear alarm — becomes overactive in regular porn users. This is why you feel constantly on edge, easily irritated, and overwhelmed in normal situations. Your nervous system is stuck in 'threat mode'. Crowded places, conversations, criticism — things others handle easily — feel unbearable. Quitting gradually calms this over 30-90 days.",
                "Cambridge University research kandupidichanga — regular porn paakuravanga brain-la amygdala (unga fear detector) always 'ON' mode-la irukkunu. Adhanala crowd-la iruntha uncomfortable, criticism ketkaRa pothu anxiety, normal conversation-layum nervous-a feel paNNuveenga. Unga nervous system always 'danger, danger' mode-la irukkum. Maththavalunga easily handle panrathai neenga unbearable-a feel panreenga. Porn quit paNNa start paNNum pothu — 30 to 90 days-la intha amygdala settle down aagum.",
                "HIGH"));

        insights.add(new AddictionInsight("BRAIN", "\uD83D\uDE35", "Brain Fog and Broken Creativity",
                "The Max Planck Institute found that regular porn use disrupts the brain networks responsible for deep thinking and creativity. Your imagination engine gets hijacked by sexual fantasies instead of real ideas. This is brain fog: you sit down to work or create but your mind goes blank. Students, engineers, and artists consistently report dramatic returns in focus and creativity within weeks of quitting.",
                "Max Planck Institute research — regular porn unga brain-la creative thinking, problem solving ellam-ku responsible part-a damage panudhu. Unga brain-la imagination engine — atha ideas ku padhila sexual fantasies-la stuck aagudhu. Intha condition-ai thaan 'brain fog' solluvaanga. Neenga sit down paNNi work paNNa paakureenga, aana brain engage aagala maari feel aagum — blank-a irukkum. Students, engineers, artists — quit paNNa sila weeks-layae focus, creativity dramatic-a return aagudhu nu solluvaanga.",
                "HIGH"));

        insights.add(new AddictionInsight("BRAIN", "\uD83E\uDDE0", "Memory and Learning Destruction",
                "Neuropsychologia research shows the hippocampus — your brain's memory and learning center — literally shrinks from chronic dopamine spikes caused by porn. This makes forming new memories, retaining information, and learning new skills much harder. Students who watch porn frequently perform significantly worse academically. The good news: quitting for 90 days shows measurable hippocampal volume recovery on brain scans.",
                "Neuropsychologia research — hippocampus (unga brain-la memory and learning center) — porn-la dopamine constantly spike and crash aagum pothu, atha literally shrink aagudhu. New things learn paNNa kashtam, information retain paNNa kashtam, skills develop paNNa kashtam aagum. Frequently porn paakura students studies-la significantly worse perform panranga nu research prove paNNi irukku. Good news: 90 days quit paNNa, brain scans-la hippocampus volume measurably recover aagiduchu nu theriyudhu.",
                "HIGH"));

        insights.add(new AddictionInsight("BRAIN", "\uD83D\uDC80", "As Damaging as Hard Drugs",
                "In 2016, the American Society of Addiction Medicine officially classified porn as a behavioural addiction with the same brain chemistry profile as cocaine and heroin. Cambridge fMRI scans showed watching porn activates the exact same wanting circuits as crack cocaine — with the same tolerance buildup, same withdrawal, and same compulsive seeking. This is not a willpower failure. It is a neurological condition that responds to the same recovery strategies as drug addiction.",
                "2016-la, American Society of Addiction Medicine officially classify paNNuthu — porn is a behavioral addiction with the same brain chemistry as cocaine and heroin. Cambridge fMRI brain scans — porn paakum pothu exactly same circuits activate aagudu, crack cocaine paakum maari thaan. Same tolerance (kooda kooda vennum), same withdrawal symptoms, same compulsive behavior. Intha problem willpower problem illai — ithu neurological disease. Drug addiction-ku yenna treatment work panudho, athae strategy ithaAiyum work panudhu.",
                "CRITICAL"));

        // ===== TESTOSTERONE =====
        insights.add(new AddictionInsight("TESTOSTERONE", "\uD83D\uDC94", "The Post-Relapse Energy Crash",
                "After relapsing, your body releases a huge surge of prolactin — the same hormone that makes you sleepy after a big meal. Research shows this prolactin surge suppresses testosterone and dopamine for 24 to 72 hours. This is the post-nut clarity — sudden exhaustion, emptiness, shame, zero motivation. Every relapse costs you 1-3 days of peak performance. Monthly relapses mean you are chronically never at full capacity.",
                "Relapse aana udata — unga body prolactin nu oru hormone mass-a release panudhu. Same hormone thaan boya sapta soruntha maari feel aakudhu. Research — intha prolactin surge testosterone and dopamine-a 24 to 72 hours-ku suppress panudhu. Ithu thaan 'post-nut clarity' — sudden-a exhausted, empty, ashamed, motivation zero feel. Oru relapse = 1 to 3 days peak performance waste. Monthly relapse paNNivittaa — neenga chronically always half capacity-la thaan operate panuveenga.",
                "HIGH"));

        insights.add(new AddictionInsight("TESTOSTERONE", "\uD83E\uDD87", "Suppressed Natural Testosterone",
                "A landmark Chinese study in the Journal of Zhejiang University found men who abstained for 7 days showed a 145.7% surge in testosterone. Constant overstimulation exhausts the HPG axis — your body's testosterone production system. Over time your body stops producing testosterone naturally because it thinks it is getting enough artificially. Result: chronic low testosterone, physical weakness, passivity, and zero drive to pursue anything meaningful.",
                "Journal of Zhejiang University-la oru landmark Chinese study — 7 days abstain paNNa aanungalukku testosterone 145.7% surge aagudhu. Porn through constant overstimulation — unga body testosterone produce paNNra HPG axis-a exhaust panudhu. Slowly unga body natural production-a reduce paNNidum. Result: chronic low testosterone — physically weak, passive, zero drive to do anything meaningful feel panuveenga.",
                "HIGH"));

        insights.add(new AddictionInsight("TESTOSTERONE", "\uD83D\uDCAA", "Loss of Confidence and Assertiveness",
                "Harvard Medical School research proves testosterone directly controls confidence, risk-taking, social assertiveness, and competitive drive. When chronically suppressed, you physically lose the neurochemical foundation of masculine confidence. You start slouching, avoiding eye contact, shrinking in social settings. Men who quit for 90+ days consistently report a return of their natural confident state — different posture, voice, and genuine power.",
                "Harvard Medical School research — testosterone directly control panudhu confidence, risk-taking, social assertiveness, competitive drive. Unga T chronically suppressed aagum pothu — neenga literally neurochemical foundation of confidence-a lose panreenga. Slouching start aagudhu, eye contact avoid panreenga, social situations-la shrink panreenga. 90+ days quit paNNa aanungal consistently solvanga — posture, voice, confidence — everything naturally comes back. They call it 'natural alpha state return'.",
                "MEDIUM"));

        insights.add(new AddictionInsight("TESTOSTERONE", "\uD83D\uDE34", "Sleep Architecture Destruction",
                "JAMA Internal Medicine research: your body produces 95% of daily testosterone during deep sleep. Stimulating screens and this habit before bed floods your brain with dopamine and cortisol, blocking melatonin and growth hormone. You wake up exhausted regardless of how many hours you slept. Over weeks and months, this chronic sleep suppression compounds into severe testosterone deficiency.",
                "JAMA Internal Medicine research — unga body 95% daily testosterone deep sleep-la thaan produce panudhu. Porn bed time-la paakum pothu — dopamine and cortisol flood aagudhu. Ithu melatonin and growth hormone release-a block panudhu. Kashtama thoonginalum exhausted-a thoorum. Weeks, months kooda kooda — intha chronic sleep suppression severe testosterone deficiency-a build up panudhu.",
                "HIGH"));

        insights.add(new AddictionInsight("TESTOSTERONE", "\uD83E\uDD2F", "Cortisol-Testosterone War",
                "Research in Hormones and Behavior: cortisol (stress hormone) and testosterone have a direct inverse relationship — when cortisol goes up, testosterone goes down. Porn addiction keeps your body in a state of constant low-level arousal and anxiety, chronically elevating cortisol. Men in this cycle describe a constant defeated feeling — like running on empty but not knowing why. Removing this cortisol source is one of the fastest ways to restore T levels.",
                "Hormones and Behavior research — cortisol (stress hormone) and testosterone direct inverse relationship — oru kooda pona, innoru keezha poyidum. Porn addiction unga body-a constant anxiety state-la vachirukku — adhanala cortisol always high irukkum. Meaning — unga testosterone always unga own stress response-a kittae suppress aagudhu. This cycle-la irukkuRavanga describe panranga — 'always defeated feel, running on empty but don't know why.' Intha cortisol source-a remove panrathae fastest way to restore T levels.",
                "HIGH"));

        // ===== RELATIONSHIPS =====
        insights.add(new AddictionInsight("RELATIONSHIPS", "\uD83D\uDC94", "Sexual Performance Destruction",
                "Porn-Induced Erectile Dysfunction (PIED) is now a recognized clinical condition. Research shows habitual porn users require increasingly extreme stimulation to achieve arousal, making real-life intimacy difficult or impossible. The brain has been rewired to respond only to screen stimulation. Recovery typically takes 90-180 days of complete abstinence as neural pathways rewire back to natural responses.",
                "Porn-Induced Erectile Dysfunction (PIED) — ithu now officially recognized clinical condition. Habitual porn users kku real life intimacy-la arousal-ae achieve paNNa kashtam aagudhu. Unga brain screen stimulation-ku maatrum respond paNNa rewire aagi irukkum. Real person kooda irukkum pothu, brain work paNNala. Recovery takes 90 to 180 days complete abstinence — because neural pathways need time to rewire back to natural responses.",
                "CRITICAL"));

        insights.add(new AddictionInsight("RELATIONSHIPS", "\uD83E\uDD75", "Oxytocin Deficiency and Emotional Numbness",
                "Oxytocin — the bonding hormone — is released through genuine human connection: touch, conversation, vulnerability. Regular porn use disrupts this system, making users emotionally numb to real relationships. University of Oklahoma research found porn users showed significantly reduced emotional empathy and bonding capacity. You can be in a loving relationship and still feel nothing. Quitting allows oxytocin pathways to recover over 60-90 days.",
                "Oxytocin — bonding hormone — real human connection through release aagudhu: touch, genuine conversation, vulnerability. Regular porn use intha system-a disrupt panudhu. University of Oklahoma research — porn users kku emotional empathy and bonding capacity significantly reduce aagudhu. Oru loving relationship-la irunthaalum — inside feel paNNuveenga 'why am I feeling nothing?' Ithu hormonal issue, weakness illa. Quit paNNa 60-90 days-la oxytocin pathways recover aagum, emotional connection naturally return aagum.",
                "HIGH"));

        insights.add(new AddictionInsight("RELATIONSHIPS", "\uD83D\uDEAB", "Objectification and Desensitization",
                "Prolonged porn consumption trains your brain to view people as objects for gratification rather than full human beings. Harvard psychology research confirms this objectification effect alters how the brain processes faces and social cues. Users subconsciously evaluate rather than connect with people in real life. This makes real intimacy feel cold and transactional. Recovery rewires this through genuine human interaction.",
                "Long time porn paakura pothu — unga brain slowly people-a objects maari paaka start panudhu. Harvard psychology research — 'objectification effect' — unga brain real people-a paakum pothu, faces and social cues-a differently process panudhu. Real life-la meet paNNra people kooda — subconsciously evaluate paNNuveenga, genuinely connect paNNa theriyala. Intimate relationships-a cold and transactional maari feel aakudhu. Quit paNNa real human interaction through — brain rewire back aagum.",
                "HIGH"));

        insights.add(new AddictionInsight("RELATIONSHIPS", "\uD83D\uDE22", "Shame, Social Isolation and Self-Destruction",
                "The shame cycle of porn addiction is clinically documented as one of its most destructive side effects. Users hide their habit, creating a secret self that cannot be shared with anyone. This isolation deepens the addiction — loneliness fuels the urge, which deepens the shame. Journal of Sex Research found shame-based isolation directly correlates with depression, anxiety disorders, and suicidal ideation. Breaking the cycle requires honesty — which communities like NoFap provide.",
                "Porn addiction-la shame cycle — clinically documented — most destructive side effects-la oru. Neenga hide paNNuveenga unga habit-a, oru 'secret self' create aagudhu — nobody knows version. Intha isolation addiction-a deeper panudhu — loneliness urge-a increase panudhu, urge shame-a increase panudhu — endless loop. Journal of Sex Research — intha shame-based isolation directly correlate aagudhu depression, anxiety, suicidal thoughts-kooda. Break paNNa single thing — honesty. Unga struggle-a acknowledge paNNrathe first step. NoFap community exactly ithukku thaan irukku.",
                "CRITICAL"));

        insights.add(new AddictionInsight("RELATIONSHIPS", "\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67", "The Marriage and Partnership Crisis",
                "Institute for Family Studies data: 79% of men who use porn daily say it has clearly influenced their sexual expectations from real relationships. The APA's 2019 review of 135 peer-reviewed studies confirmed significant links between porn use and relationship dissatisfaction, infidelity, and divorce. In South Korea and Japan, researchers link porn explosion to dramatic declines in birth and marriage rates — calling it a demographic emergency.",
                "Institute for Family Studies data — daily porn paakura 79% men solvanga 'it has clearly changed my expectations from real relationships.' APA 2019 review — 135 research studies analyzed — porn use and relationship dissatisfaction, infidelity, divorce — significant link irukku nu confirm paNNuthu. South Korea and Japan — government researchers link panraanga porn explosion to dramatic drop in birth rates and marriage rates — 'demographic emergency' solluvaanga. Indha scale-la impact irukku.",
                "HIGH"));

        // ===== WORLD STATS =====
        insights.add(new AddictionInsight("WORLD_STATS", "\uD83C\uDF0D", "A Global Epidemic",
                "Pornhub's 2023 annual report revealed 115 million daily visits to their site alone. The global pornography industry generates over $97 billion annually — larger than Netflix, Amazon Prime, and Apple TV combined. 88% of mainstream porn contains acts of physical aggression. Every 39 minutes, a new pornographic video is created in the United States. You are not struggling with a personal weakness — you are fighting a $97 billion industry designed to keep you addicted.",
                "Pornhub 2023 annual report — single site-la 115 million daily visits. Global porn industry — $97 billion+ annually generate panudhu. Netflix, Amazon Prime, Apple TV combined-a vida perusana industry. 88% mainstream porn-la physical aggression acts irukku. Every 39 minutes oru new pornographic video United States-la create aagudhu. Intha problem 'personal weakness' illa — neenga $97 billion worth industry against fight panreenga. Industry design paNNapadhe you-a addicted vacha maari.",
                "CRITICAL"));

        insights.add(new AddictionInsight("WORLD_STATS", "\uD83D\uDC76", "Childhood Exposure Crisis",
                "The average age of first exposure to pornography is now 11 years old globally. 93% of boys and 62% of girls are exposed to internet porn before age 18. Brain research shows adolescent brains — still developing until age 25 — are significantly more vulnerable to addictive rewiring than adult brains. An entire generation is being neurologically altered before they understand what is happening to them.",
                "Globally first porn exposure average age now 11 years. 93% boys and 62% girls — age 18 before internet porn-ku exposed aagiraanga. Brain research — adolescent brain (25 years varaikum develop aagudhu) — adult brain-a vida significantly more vulnerable to addictive rewiring. Oru entire generation neurologically altered aagudhu — even before they understand what is happening to them. Ithu scale-la how serious nu theriyudha?",
                "HIGH"));

        insights.add(new AddictionInsight("WORLD_STATS", "\uD83D\uDC94", "Destroying Real Relationships at Scale",
                "Institute for Family Studies: 79% of daily porn users say it has clearly influenced their real-life relationship expectations. The APA's 2019 review of 135 studies confirmed significant links to relationship dissatisfaction, infidelity, sexual violence attitudes, and divorce. In South Korea and Japan, porn explosion is linked to dramatic declines in birth and marriage rates — labeled a demographic emergency.",
                "Institute for Family Studies — daily porn users-la 79% solluvaanga 'it has clearly influenced my real relationship expectations.' APA 2019 review — 135 peer-reviewed studies analyzed — relationship dissatisfaction, infidelity, sexual violence attitudes, divorce — significant link confirmed. South Korea and Japan-la government researchers — porn explosion-a dramatic decline in birth rates and marriage rates-kooda link paNNraanga — 'demographic emergency' nu call paNNraanga. Ithu personal problem mattum illa — societal crisis.",
                "HIGH"));

        insights.add(new AddictionInsight("WORLD_STATS", "\uD83D\uDCC5", "Only 3% Reach Day 90",
                "Data from over 800,000 r/NoFap users: only 3% of people who attempt a 90-day challenge actually complete it. 70% of all attempts end within the first 7 days. There is a significant flatline dip between days 14-45 where relapse rates spike. If you are past Day 7, you have already beaten the majority of everyone who has ever tried. Every day past Day 30 puts you in the top 15% of all humans who have attempted this.",
                "800,000+ r/NoFap users data — 90-day challenge attempt paNNuRavanga-la only 3% complete paNNuvaanga. 70% of all attempts — first 7 days-layae end aagudhu. Day 14 to 45 — 'flatline dip' — relapse rates spike aagudhu. Day 7 past paNNitteenga-na — neenga already majority people-a beat paNNiteenga who ever tried this. Day 30 past paNNitteenga-na — globally top 15% humans who attempted this. Itha celebrate paNNunga.",
                "MEDIUM"));

        insights.add(new AddictionInsight("WORLD_STATS", "\u23F0", "The Day 5 Wall",
                "NoFap community analysis of 300,000+ relapse reports: Day 5 is statistically the most dangerous single day in the challenge — accounting for approximately 18% of all first-week relapses. This is because the initial dopamine crash from withdrawal peaks around Day 4-6, creating an overwhelming urge that feels unbearable. This is normal and neurologically predictable. The urge is not weakness — it is your brain's addiction circuitry fighting to survive. It always fades within 20 minutes if you use distraction techniques.",
                "300,000+ relapse reports analysis — Day 5 statistically most dangerous single day in the challenge. Approximately 18% of all first-week relapses Day 5-la happen aagudhu. Yaen nu theriyuma — withdrawal-la initial dopamine crash Day 4-6-la peak aagudhu, overwhelming urge create aagudhu. Ithu completely normal — neurologically predictable. Intha urge weakness illai — unga brain's addiction circuitry fight paNNudhu survive-a. Always important: intha urge 20 minutes-la fade aagudhu — distraction technique use panreengana. Never give in to the Day 5 wall.",
                "MEDIUM"));

        insights.add(new AddictionInsight("WORLD_STATS", "\uD83D\uDCC8", "The 34% Productivity Surge",
                "A 2019 study of 500 men tracked over 60 days: those who abstained for 30+ days showed a 34% average increase in self-reported productivity, focus, and task completion. Social Psychological and Personality Science found sexual restraint directly correlates with higher academic achievement, career performance, and goal-directed behavior. When your motivation systems are not artificially depleted, your brain redirects that drive toward real-world goals. The energy is the same — only the direction changes.",
                "2019 study — 500 men, 60 days track paNNutanga — 30+ days abstain paNNa people — 34% average increase in productivity, focus, task completion. Sexual restraint directly correlate aagudhu higher academic achievement, career performance, goal-directed behavior-kooda. When unga motivation system artificially depleted illaa pothu — unga brain that drive-a real-world goals-ku redirect panudhu. Energy same thaan — direction mattum maara pochu. Antha energy ippo unga career, skills, life-ku poi sern.",
                "MEDIUM"));

        // ===== DOPAMINE =====
        insights.add(new AddictionInsight("DOPAMINE", "\uD83E\uDDE0", "Your Brain's Motivation Engine",
                "Dopamine is not the pleasure chemical — it is the wanting and motivation chemical. Neuroscientist Dr. Kent Berridge proved dopamine drives craving and seeking, not the pleasure of receiving. This is why an addict keeps seeking more even though it no longer feels good. Natural dopamine comes from real achievements — exercise, learning, creating, social connection. Porn floods your system with 5-10x the normal dopamine in seconds, making everything else feel impossibly dull.",
                "Dopamine — 'pleasure chemical' illai — 'wanting and motivation chemical.' Dr. Kent Berridge prove paNNuthu — dopamine craving and seeking-a drive panudhu, not the pleasure of receiving. Adhanala addict keep seeking more — even though it no longer feels good. Natural dopamine — real achievements-la irundhu varudhu: exercise, learning, creating, social connection. Porn 5-10x normal dopamine seconds-la flood panudhu — making everything else feel impossibly dull by comparison. Unga brain's baseline completely skewed.",
                "CRITICAL"));

        insights.add(new AddictionInsight("DOPAMINE", "\uD83E\uDD87", "Dopamine Receptor Downregulation",
                "When your brain is repeatedly flooded with extreme dopamine spikes from porn, it protects itself by reducing D2 dopamine receptors — turning down the volume dial on your ability to feel pleasure. This is the same mechanism as cocaine and methamphetamine addiction. With fewer receptors, you need more and more extreme stimulation to feel anything. This explains escalation — always needing something more intense than before. Recovery rebuilds these receptors over 90+ days.",
                "Unga brain repeatedly extreme dopamine spikes-ku exposed aagum pothu — brain protect paNNa D2 dopamine receptors-a reduce panudhu — effectively pleasure feel paNNra capacity-a keezha aagidum. Cocaine and methamphetamine addiction-layum same mechanism. Fewer receptors = more and more extreme stimulation vennum something feel paNNa. Ithu thaan escalation explain panudhu — always needing something more intense than before. Never satisfied. 90+ days recovery-la these receptors rebuild aagum.",
                "HIGH"));

        insights.add(new AddictionInsight("DOPAMINE", "\uD83C\uDF7A", "Dopamine Fasting - The Reset Mechanism",
                "The NoFap challenge is essentially a structured dopamine detox — the same process recommended by clinical psychologists for treating behavioral addictions. By removing the artificial superstimulation source, you allow dopamine receptors to upregulate back to baseline. The flatline period where you feel completely numb is the active receptor recovery phase — not a sign that you are broken. Once complete, everyday activities begin releasing dopamine normally and life feels genuinely rewarding.",
                "NoFap challenge = structured dopamine detox — clinical psychologists recommend paNNra exact same process for behavioral addictions. Artificial superstimulation source remove paNNum pothu — dopamine receptors upregulate aagum (increase in number and sensitivity, back to baseline). Flatline period (Days 14-45) — completely numb feel — this is not brokenness. This is the active receptor recovery phase. Ithu complete aana pothu — daily activities naturally dopamine release start panudhu, life genuinely rewarding feel aagum.",
                "HIGH"));

        insights.add(new AddictionInsight("DOPAMINE", "\uD83C\uDF1E", "The Natural Dopamine Rebuild",
                "Max Planck Institute research: after sustained abstinence, the brain gradually rebuilds natural dopamine sensitivity. Activities that previously felt dull — exercise, music, meaningful work, real conversation, sunlight, cold water — begin generating genuine dopamine hits again. NoFap veterans call this the return. Colors look brighter. Music sounds better. Food tastes better. Motivation feels effortless. This is measurable neuroplasticity — your brain physically rebuilding the hardware for experiencing real joy.",
                "Max Planck Institute research — sustained abstinence-la, brain gradually natural dopamine sensitivity rebuild panudhu. Previously boring feel paNNitta activities — exercise, music, meaningful work, real conversation, sunlight, cold water — genuine dopamine hits again generate panudhu start aagum. NoFap veterans call this 'the return.' Colors bright-a theriyudhu. Music better-a soludhu. Food taste better-a theriyudhu. Motivation effortless feel aagudhu. Ithu placebo illai — measurable neuroplasticity. Unga brain literally hardware rebuild panudhu to experience real joy.",
                "MEDIUM"));

        insights.add(new AddictionInsight("DOPAMINE", "\uD83C\uDFAF", "Dopamine and Life Goals",
                "Research by Dr. Tali Sharot shows dopamine is directly responsible for optimism, ambition, and future-oriented thinking. When your dopamine system is hijacked by addiction, your brain loses the neurochemical foundation for ambition. You stop dreaming. Plans feel pointless. Goals feel unreachable. Recovering your natural dopamine system does not just make you feel better — it makes you neurologically capable of pursuing the life you actually want to live.",
                "Dr. Tali Sharot research — dopamine is directly responsible for optimism, ambition, future-oriented thinking. Unga dopamine system hijacked aagum pothu — unga brain literally loses neurochemical foundation for ambition. Neenga dream paNNuvatha nirthuveega. Plans pointless-a feel aagudhu. Goals unreachable-a feel aagudhu. Natural dopamine recover aagum pothu — ithu just 'feel better' matter illa — unga brain neurologically capable of pursuing the life you actually want. Antha life-a live paNNa unga brain needs to be free.",
                "CRITICAL"));

        return insights;
    }

    private List<String> worldStats() {
        return List.of(
                "70% of men fail before Day 7 — you're already beating the odds",
                "Only 15% of challengers reach Day 30",
                "Only 3% reach Day 90 — elite territory",
                "Huge boost in natural male energy around Day 21",
                "Average global fail day: Day 5 — you've outlasted most already",
                "Men with 30+ day streaks report getting 34% more work done",
                "Brain scans show this addiction is as damaging as hard drugs",
                "Your brain takes about 14–21 days to start enjoying normal things again"
        );
    }
}

