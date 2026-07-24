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

    public NoFapService(DopamineLogRepository logRepo,
                        PlayerRepository playerRepo,
                        LevelService levelService) {
        this.logRepo = logRepo;
        this.playerRepo = playerRepo;
        this.levelService = levelService;
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
        List<DopamineLog> last90 = logRepo.findByPlayerIdAndLogDateBetweenOrderByLogDateDesc(
                playerId, LocalDate.now().minusDays(89), LocalDate.now());

        Map<LocalDate, DopamineLog> byDate = last90.stream()
                .collect(Collectors.toMap(DopamineLog::getLogDate, l -> l));

        int currentStreak = computeCurrentStreak(byDate);
        int longestStreak = computeLongestStreak(playerId);

        Optional<DopamineLog> today = Optional.ofNullable(byDate.get(LocalDate.now()));
        boolean todayConfirmed = today.isPresent();
        boolean todayClean = today.map(l -> !l.isPornViewed()).orElse(true); // no record = streak intact

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

        // XP bonus
        dto.setXpBonusPct(Math.min(50.0, (currentStreak / 7) * 5.0));

        // System verdict
        dto.setSystemVerdict(systemVerdict(currentStreak));

        // 90-day heatmap
        List<Boolean> heatmap = new ArrayList<>();
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
    public NoFapStatusDTO reportRelapse(Long playerId) {
        upsertPornViewed(playerId, true);
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
        logRepo.save(log);
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

    /**
     * Counts consecutive clean days ending today.
     * Today with no record: streak continues (not yet confirmed is fine).
     */
    private int computeCurrentStreak(Map<LocalDate, DopamineLog> byDate) {
        int streak = 0;
        LocalDate cursor = LocalDate.now();

        // If today has a record and it's a relapse, streak = 0
        DopamineLog todayLog = byDate.get(cursor);
        if (todayLog != null && todayLog.isPornViewed()) return 0;

        // Count backwards
        cursor = cursor.minusDays(1);
        while (true) {
            DopamineLog log = byDate.get(cursor);
            if (log == null) break; // no record on past day = stop
            if (log.isPornViewed()) break; // relapse = stop
            streak++;
            cursor = cursor.minusDays(1);
        }
        return streak; // today "pending" day not counted until confirmed
    }

    private int computeLongestStreak(Long playerId) {
        List<DopamineLog> all = logRepo.findByPlayerIdAndLogDateBetweenOrderByLogDateDesc(
                playerId, LocalDate.now().minusDays(365), LocalDate.now());
        // Sort ascending
        all.sort(Comparator.comparing(DopamineLog::getLogDate));
        int longest = 0, current = 0;
        for (DopamineLog log : all) {
            if (!log.isPornViewed()) {
                current++;
                longest = Math.max(longest, current);
            } else {
                current = 0;
            }
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
        if (streak < 3) return "◈ Day " + streak + ". The hardest part. Push through the struggle.";
        if (streak < 7) return "◈ Day " + streak + ". Your brain is healing. Stay strong.";
        if (streak < 14) return "◈ Day " + streak + ". First milestone cleared. Your reward system is resetting.";
        if (streak < 21) return "◈ Day " + streak + ". Memory and focus are improving. You're changing.";
        if (streak < 30) return "◈ Day " + streak + ". Energy surge incoming. The warrior awakens.";
        if (streak < 60) return "◈ Day " + streak + ". You're in the top 15%. Hard work feels easier now.";
        if (streak < 90) return "◈ Day " + streak + ". Elite territory. Your brain is fully rewiring itself.";
        return "◈ Day " + streak + ". FULL REBOOT COMPLETE. Shadow Monarch discipline achieved.";
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

        cards.add(new ScienceDayCard(0, "REWIRING", "🔴", "Day 0 — The Starting Line",
                "Your brain's reward system is used to being overstimulated. The healing begins now. Expect strong urges in the first few days — this is normal when breaking a bad habit.", "DOPAMINE"));

        cards.add(new ScienceDayCard(1, "REWIRING", "🧠", "Day 1 — The Struggle Begins",
                "As you stop the bad habit, you might feel tired, grumpy, and have 'brain fog'. This is just your brain realizing it's not getting that fake reward anymore. Stay strong.", "DOPAMINE"));

        cards.add(new ScienceDayCard(3, "REWIRING", "⚡", "Day 3 — The Flatline",
                "You might feel empty, bored, or have zero energy. This is called a 'flatline'. It means your brain is resetting itself. It will pass soon.", "DOPAMINE"));

        cards.add(new ScienceDayCard(5, "REWIRING", "💤", "Day 5 — Better Sleep",
                "Without the heavy energy crash from relapsing, your sleep starts getting better. You might sleep deeper and start remembering your dreams clearly.", "SLEEP"));

        cards.add(new ScienceDayCard(7, "REWIRING", "🔋", "Day 7 — Happiness Returning",
                "After 7 days, your brain starts enjoying normal things again. Food tastes better. Music sounds richer. You are finding joy in the real world again. First milestone cleared.", "DOPAMINE"));

        cards.add(new ScienceDayCard(10, "REWIRING", "🎯", "Day 10 — Focus Returning",
                "The 'CEO' part of your brain is getting stronger. You will notice it's much easier to focus on boring or hard tasks without getting distracted.", "FOCUS"));

        cards.add(new ScienceDayCard(14, "CLARITY", "📚", "Day 14 — Sharper Memory",
                "Two weeks clean. Your mind is getting sharper. You will find it easier to remember things, learn new skills, and solve problems at work or school.", "MEMORY"));

        cards.add(new ScienceDayCard(16, "CLARITY", "😤", "Day 16 — Social Confidence",
                "Your connection hormones are back to normal. You might notice less shyness, find it easier to look people in the eye, and actually want to talk to people.", "CONFIDENCE"));

        cards.add(new ScienceDayCard(21, "CLARITY", "💪", "Day 21 — Energy Surge",
                "Men often report a huge boost in male energy around 3 weeks. You will likely feel more confident, motivated, and physically stronger. Use this energy to work out or build something.", "TESTOSTERONE"));

        cards.add(new ScienceDayCard(25, "CLARITY", "🔥", "Day 25 — The Aura",
                "Higher energy and confidence create what people call 'the aura'. People will notice a change in your vibe and how you carry yourself.", "CONFIDENCE"));

        cards.add(new ScienceDayCard(30, "TRANSFORMATION", "🌊", "Day 30 — Deep Focus Unlocked",
                "Your brain is no longer constantly looking for a quick hit. It now naturally focuses on creative thinking and solving real problems. Hard work feels easier.", "FOCUS"));

        cards.add(new ScienceDayCard(40, "TRANSFORMATION", "🎨", "Day 40 — Creativity Peaks",
                "You are turning your built-up energy into creativity. Many people report doing their best work, writing, or art during this time. You are highly motivated.", "FOCUS"));

        cards.add(new ScienceDayCard(45, "TRANSFORMATION", "👥", "Day 45 — Better Relationships",
                "Social fear is fading away. Eye contact feels totally natural. You approach people with calm confidence instead of hiding away. Real connection feels good again.", "CONFIDENCE"));

        cards.add(new ScienceDayCard(60, "TRANSFORMATION", "🧬", "Day 60 — Brain Healing",
                "Your brain is physically rebuilding itself. The parts that were damaged by the bad habit are getting stronger every single day.", "NEUROPLASTICITY"));

        cards.add(new ScienceDayCard(75, "TRANSFORMATION", "⚙️", "Day 75 — Stable Moods",
                "Your energy and hormones are completely balanced. Your energy levels are high all day long. Your mood is stable. The emotional rollercoaster is finally over.", "TESTOSTERONE"));

        cards.add(new ScienceDayCard(90, "MASTERY", "👑", "Day 90 — FULL REBOOT",
                "The ultimate milestone. Your brain's reward system is fully healed. You are now in the top 3% globally who reach this goal. You are no longer an addict.", "NEUROPLASTICITY"));

        cards.add(new ScienceDayCard(120, "MASTERY", "🏔️", "Day 120 — Peak Performance",
                "Your ability to learn and grow is at its absolute best. Every area of your life — fitness, coding, relationships — benefits from your new, healthy mind.", "MEMORY"));

        cards.add(new ScienceDayCard(180, "MASTERY", "🌟", "Day 180 — A New Person",
                "At 6 months, you are a completely new person. The discipline you learned here helps you succeed in your career, fitness, and life.", "CONFIDENCE"));

        cards.add(new ScienceDayCard(365, "MASTERY", "💎", "Day 365 — SHADOW MONARCH",
                "One full year. The rarest achievement. Your brain is fundamentally different and stronger than it was a year ago. You have conquered a habit that controls millions.", "NEUROPLASTICITY"));

        return cards;
    }

    private List<AddictionInsight> buildAddictionInsights() {
        List<AddictionInsight> insights = new ArrayList<>();

        // ── BRAIN category ──
        insights.add(new AddictionInsight("BRAIN", "🧠", "Brain Damage from Porn",
                "Watching too much porn damages the part of your brain that controls willpower. This makes you lazy, causes you to put off important work, and makes it harder to control your impulses.",
                "CRITICAL"));
        insights.add(new AddictionInsight("BRAIN", "⚡", "The Reward System Trap",
                "Porn gives your brain fake, massive rewards. Because of this, normal everyday life starts feeling boring. You stop finding joy in simple things like hobbies or hanging out with friends.",
                "CRITICAL"));
        insights.add(new AddictionInsight("BRAIN", "😤", "High Stress and Anxiety",
                "The fear and emotion center of your brain becomes overactive. This makes you feel easily annoyed, highly anxious, and overwhelmed by normal social situations.",
                "HIGH"));
        insights.add(new AddictionInsight("BRAIN", "🌀", "Broken Thought Process",
                "Instead of naturally thinking about creative ideas or your future goals, your mind constantly wanders to urges and fantasies. This causes 'brain fog' and makes you uncreative.",
                "HIGH"));
        insights.add(new AddictionInsight("BRAIN", "📉", "Memory Problems",
                "The bad habit blocks the learning pathways in your brain. Students and workers who watch a lot of porn often struggle to remember things and learn new skills.",
                "HIGH"));
        insights.add(new AddictionInsight("BRAIN", "🩻", "Like Hard Drugs",
                "Researchers have found that when people look at porn, their brains show the exact same damage and reactions as someone addicted to hard drugs like cocaine.",
                "CRITICAL"));

        // ── TESTOSTERONE category ──
        insights.add(new AddictionInsight("TESTOSTERONE", "💉", "The Energy Drain",
                "Relapsing releases a 'tired' hormone that kills your motivation for 24-48 hours. This is the huge energy crash that makes you feel exhausted, lazy, and want to hide from the world.",
                "HIGH"));
        insights.add(new AddictionInsight("TESTOSTERONE", "📉", "Low Male Energy",
                "Constant overstimulation stops your body from naturally producing male hormones. This makes you feel physically weak, passive, and lacking the drive to achieve your goals.",
                "HIGH"));
        insights.add(new AddictionInsight("TESTOSTERONE", "💪", "Loss of Confidence",
                "Without strong, healthy hormone levels, you lose the natural confidence, assertiveness, and physical strength that makes you feel powerful and alive.",
                "MEDIUM"));
        insights.add(new AddictionInsight("TESTOSTERONE", "😴", "Ruined Sleep Quality",
                "Looking at screens and engaging in this bad habit before bed ruins your sleep. Since your body builds most of its energy during deep sleep, you wake up feeling drained.",
                "HIGH"));
        insights.add(new AddictionInsight("TESTOSTERONE", "⚡", "High Stress Hormones",
                "This addiction keeps your stress levels constantly high. High stress fights against your body's natural strength, creating a 'defeated' feeling.",
                "HIGH"));

        // ── RELATIONSHIPS category ──
        insights.add(new AddictionInsight("RELATIONSHIPS", "💔", "Real World Problems",
                "Getting used to fake, extreme videos makes real partners seem boring. Many young men now suffer from severe performance issues in real life because their brains are trained only for screens.",
                "CRITICAL"));
        insights.add(new AddictionInsight("RELATIONSHIPS", "🤝", "Losing Connection",
                "The addiction blocks the natural 'bonding' chemicals in your brain. This makes it very hard to feel true love, care, or deep connection, even with good people in your life.",
                "HIGH"));
        insights.add(new AddictionInsight("RELATIONSHIPS", "👁️", "Seeing People as Objects",
                "Your brain gets trained to look at people like objects instead of real humans. This destroys your ability to have normal, healthy, and happy relationships.",
                "HIGH"));
        insights.add(new AddictionInsight("RELATIONSHIPS", "😰", "Social Fear",
                "Deep down, the shame of the addiction destroys your self-esteem. You might start avoiding eye contact, skipping social events, and hiding from people because of this hidden shame.",
                "HIGH"));

        // ── WORLD_STATS category ──
        insights.add(new AddictionInsight("WORLD_STATS", "🌍", "40 Million Daily Visitors",
                "40 million Americans visit these websites every single day. It is the most consumed type of content on the internet — pulling millions of men away from achieving their real potential.",
                "MEDIUM"));
        insights.add(new AddictionInsight("WORLD_STATS", "👦", "Exposed Too Young",
                "The average age a person first sees this content is 11 years old. This early exposure severely damages the brain before it even has a chance to fully grow and mature.",
                "CRITICAL"));
        insights.add(new AddictionInsight("WORLD_STATS", "💑", "Destroying Marriages",
                "Over half of divorce cases in the US cite this addiction as a major problem. It is destroying real-world families and intimacy everywhere.",
                "HIGH"));
        insights.add(new AddictionInsight("WORLD_STATS", "📊", "Only 3% Reach Day 90",
                "Based on community data, only about 3% of people who attempt this challenge actually reach Day 90. Reaching this milestone proves you have incredible self-discipline.",
                "MEDIUM"));
        insights.add(new AddictionInsight("WORLD_STATS", "⏱️", "Average Relapse: Day 5",
                "Most people fail around Day 5. The first week is the absolute hardest battle. If you can push past Day 7, your chances of winning go way up.",
                "MEDIUM"));
        insights.add(new AddictionInsight("WORLD_STATS", "📈", "34% Productivity Increase",
                "Men who stay clean for 30 days or more report a massive 34% increase in their focus, work output, and daily success. The benefits are real and proven.",
                "MEDIUM"));

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
