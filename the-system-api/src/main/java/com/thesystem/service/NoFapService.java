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

    public NoFapService(DopamineLogRepository logRepo) {
        this.logRepo = logRepo;
    }

    // ────────────────────────────────────────────────────────────────────────
    // Public API
    // ────────────────────────────────────────────────────────────────────────

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
        upsertPornViewed(playerId, false);
        return getStatus(playerId);
    }

    @Transactional
    public NoFapStatusDTO reportRelapse(Long playerId) {
        upsertPornViewed(playerId, true);
        return getStatus(playerId);
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
                    return n;
                });
        log.setPornViewed(pornViewed);
        logRepo.save(log);
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
        if (streak < 3) return "◈ Day " + streak + ". Withdrawal is real. Push through the fog.";
        if (streak < 7) return "◈ Day " + streak + ". Receptors are waking up. Stay disciplined.";
        if (streak < 14) return "◈ Day " + streak + ". First milestone cleared. Dopamine is resetting.";
        if (streak < 21) return "◈ Day " + streak + ". Memory and focus sharpening. You're changing.";
        if (streak < 30) return "◈ Day " + streak + ". Testosterone surge incoming. The warrior awakens.";
        if (streak < 60) return "◈ Day " + streak + ". You're in the top 15%. Deep work is natural now.";
        if (streak < 90) return "◈ Day " + streak + ". Elite territory. Neuroplasticity at full swing.";
        return "◈ Day " + streak + ". NEUROLOGICAL REBOOT COMPLETE. Shadow Monarch discipline achieved.";
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
                "Dopamine baseline is artificially elevated from chronic stimulation. Your brain has been hijacked. The rewiring begins now. Expect intense urges in the first 72 hours — this is withdrawal.", "DOPAMINE"));

        cards.add(new ScienceDayCard(1, "REWIRING", "🧠", "Day 1 — Withdrawal Begins",
                "Dopamine crashes as artificial stimulation stops. Brain fog, irritability, and restlessness are normal withdrawal symptoms. Your prefrontal cortex is starting to regain control.", "DOPAMINE"));

        cards.add(new ScienceDayCard(3, "REWIRING", "⚡", "Day 3 — The Flatline",
                "Many report a 'flatline' — reduced libido and emotional numbness. This is your brain recalibrating. The flatline is proof the rewiring is working. It will pass.", "DOPAMINE"));

        cards.add(new ScienceDayCard(5, "REWIRING", "💤", "Day 5 — Sleep Improving",
                "Without the prolactin crash from PMO, sleep quality begins improving. REM sleep deepens. You may notice more vivid dreams as your brain consolidates memories properly.", "SLEEP"));

        cards.add(new ScienceDayCard(7, "REWIRING", "🔋", "Day 7 — Dopamine Receptors Upregulating",
                "After 7 days, D2 dopamine receptors begin recovering. Baseline pleasure from real-world activities (+15%) starts returning. Food tastes better. Music sounds richer. First milestone cleared.", "DOPAMINE"));

        cards.add(new ScienceDayCard(10, "REWIRING", "🎯", "Day 10 — Focus Returning",
                "The prefrontal cortex (executive control center) is regaining strength. You'll notice improved ability to concentrate on boring tasks. Your brain's executive function is coming back online.", "FOCUS"));

        cards.add(new ScienceDayCard(14, "CLARITY", "📚", "Day 14 — Memory Recall Improving",
                "Two weeks clean. Prefrontal cortex activity measurably increases. Working memory improves — you'll find it easier to remember names, learn skills, and retain information.", "MEMORY"));

        cards.add(new ScienceDayCard(16, "CLARITY", "😤", "Day 16 — Social Confidence Emerging",
                "Oxytocin and vasopressin levels normalizing. Social bonding hormones return. You may notice less social anxiety, more eye contact, stronger desire for real human connection.", "CONFIDENCE"));

        cards.add(new ScienceDayCard(21, "CLARITY", "💪", "Day 21 — Testosterone Surge (+21%)",
                "Jiangsu University study (2003): Men abstaining for 21 days showed a 21% increase in testosterone. LH and FSH normalize, driving testosterone production. Confidence, aggression, muscle growth all increase.", "TESTOSTERONE"));

        cards.add(new ScienceDayCard(25, "CLARITY", "🔥", "Day 25 — Aura and Presence",
                "Higher testosterone combined with normalized dopamine creates what the community calls 'the aura' — an increased magnetic social presence. People notice the change in your energy and confidence.", "CONFIDENCE"));

        cards.add(new ScienceDayCard(30, "TRANSFORMATION", "🌊", "Day 30 — Deep Focus Unlocked",
                "Default Mode Network (DMN) normalizes. Your brain no longer defaults to urges — it defaults to creative thinking and problem solving. Deep work sessions become effortless and natural.", "FOCUS"));

        cards.add(new ScienceDayCard(40, "TRANSFORMATION", "🎨", "Day 40 — Creativity Peaks",
                "Sexual energy (transmuted) fuels creativity. Many artists, athletes, and builders report peak creative output during extended abstinence. Your motivation systems are now driving real-world goals.", "FOCUS"));

        cards.add(new ScienceDayCard(45, "TRANSFORMATION", "👥", "Day 45 — Social Rewiring Complete",
                "Social anxiety measurably decreases. Eye contact feels natural. You approach people with calm confidence instead of avoidance. Real intimacy becomes possible again as oxytocin is no longer blunted.", "CONFIDENCE"));

        cards.add(new ScienceDayCard(60, "TRANSFORMATION", "🧬", "Day 60 — Neuroplasticity Peaks",
                "Gray matter density begins increasing in the nucleus accumbens and prefrontal cortex — the same regions shrunk by addiction. Your brain is physically rebuilding itself at the cellular level.", "NEUROPLASTICITY"));

        cards.add(new ScienceDayCard(75, "TRANSFORMATION", "⚙️", "Day 75 — Hormonal Equilibrium",
                "Prolactin, cortisol, dopamine, testosterone — all hormonal systems fully recalibrated. Energy levels are consistently high. Mood is stable. The emotional rollercoaster is over.", "TESTOSTERONE"));

        cards.add(new ScienceDayCard(90, "MASTERY", "👑", "Day 90 — NEUROLOGICAL REBOOT",
                "The gold standard milestone. Brain reward system fully re-sensitized. Dopamine receptors restored to baseline. You are now in the top 3% globally who reach this milestone. Identity shift: you are no longer an addict.", "NEUROPLASTICITY"));

        cards.add(new ScienceDayCard(120, "MASTERY", "🏔️", "Day 120 — Sustained Peak Performance",
                "Long-term potentiation in the hippocampus strengthens. Learning speed accelerates. Every discipline in your life — fitness, coding, relationships — benefits from the neural pathways you've built.", "MEMORY"));

        cards.add(new ScienceDayCard(180, "MASTERY", "🌟", "Day 180 — Identity Transformation Complete",
                "At 6 months, the identity shift is complete. Self-discipline learned through NoFap generalizes to all life areas. Men report major life improvements in career, relationships, fitness, and mental clarity.", "CONFIDENCE"));

        cards.add(new ScienceDayCard(365, "MASTERY", "💎", "Day 365 — SHADOW MONARCH",
                "One full year. The rarest achievement. Your neural architecture is fundamentally different from who you were 365 days ago. You have conquered the addiction that controls the majority of men on the planet.", "NEUROPLASTICITY"));

        return cards;
    }

    private List<AddictionInsight> buildAddictionInsights() {
        List<AddictionInsight> insights = new ArrayList<>();

        // ── BRAIN category ──
        insights.add(new AddictionInsight("BRAIN", "🧠", "Prefrontal Cortex Shrinkage",
                "Chronic porn use causes measurable gray matter reduction in the prefrontal cortex — the brain's CEO. This leads to poor impulse control, procrastination, inability to delay gratification, and reduced willpower.",
                "CRITICAL"));
        insights.add(new AddictionInsight("BRAIN", "⚡", "Dopamine System Hijacked",
                "Porn exploits the Coolidge Effect — the brain's novelty-seeking circuit. Infinite novelty on screens desensitizes D2 receptors. Everyday life becomes bland and unstimulating. You need more extreme content to feel anything.",
                "CRITICAL"));
        insights.add(new AddictionInsight("BRAIN", "😤", "Amygdala Hyper-Activation",
                "The amygdala (threat/emotion center) becomes chronically over-activated. This manifests as anxiety, irritability, emotional dysregulation, and hypersensitivity. Social situations feel threatening.",
                "HIGH"));
        insights.add(new AddictionInsight("BRAIN", "🌀", "Default Mode Network Corrupted",
                "Instead of defaulting to creative thinking or future planning, the hijacked brain defaults to urges and fantasy. This is why you feel mentally foggy and uncreative — your brain's idle mode is broken.",
                "HIGH"));
        insights.add(new AddictionInsight("BRAIN", "📉", "Memory and Learning Impaired",
                "Reduced prefrontal-hippocampal connectivity impairs working memory, long-term potentiation, and learning speed. Students and coders who watch porn frequently consistently report difficulty retaining information.",
                "HIGH"));
        insights.add(new AddictionInsight("BRAIN", "🩻", "Brain Scans Match Cocaine Addicts",
                "Cambridge University (2014): Brain imaging of compulsive porn users showed the same patterns of activation as cocaine and alcohol addicts when shown their drug of choice. Porn addiction is neurologically real.",
                "CRITICAL"));

        // ── TESTOSTERONE category ──
        insights.add(new AddictionInsight("TESTOSTERONE", "💉", "Prolactin Crash After PMO",
                "Ejaculation triggers a prolactin spike that suppresses dopamine for 24-48 hours. This causes the post-PMO 'crash' — fatigue, brain fog, social withdrawal, and reduced motivation that men mistake for laziness.",
                "HIGH"));
        insights.add(new AddictionInsight("TESTOSTERONE", "📉", "LH/FSH Suppression",
                "Chronic overstimulation suppresses Luteinizing Hormone (LH) and Follicle-Stimulating Hormone (FSH) — the signals that tell your testes to produce testosterone. Result: chronically low-T symptoms.",
                "HIGH"));
        insights.add(new AddictionInsight("TESTOSTERONE", "💪", "DHT and Androgen Receptors Blunted",
                "Low DHT (dihydrotestosterone) reduces the androgenic drive behind confidence, muscle synthesis, assertiveness, and sexual vitality. Men feel passive, unmotivated, and physically weak.",
                "MEDIUM"));
        insights.add(new AddictionInsight("TESTOSTERONE", "😴", "Sleep Architecture Disrupted",
                "PMO before bed suppresses melatonin and disrupts REM sleep cycles. 70-80% of daily testosterone is produced during deep sleep. Disrupted sleep = chronically low testosterone the next day.",
                "HIGH"));
        insights.add(new AddictionInsight("TESTOSTERONE", "⚡", "Cortisol Elevation",
                "Chronic dopamine dysregulation elevates baseline cortisol (stress hormone). Cortisol is directly antagonistic to testosterone. High cortisol + low testosterone = the 'defeated male' hormonal profile.",
                "HIGH"));

        // ── RELATIONSHIPS category ──
        insights.add(new AddictionInsight("RELATIONSHIPS", "💔", "Porn-Induced ED (PIED)",
                "Desensitization to 2D fantasy makes real partners less stimulating. Porn-Induced Erectile Dysfunction affects men in their 20s and 30s at alarming rates. The brain has been rewired to respond only to screens.",
                "CRITICAL"));
        insights.add(new AddictionInsight("RELATIONSHIPS", "🤝", "Oxytocin Blunted",
                "The bonding hormone oxytocin is blunted by chronic PMO. This reduces the ability to form deep emotional connections with real partners. Men report feeling emotionally detached even in healthy relationships.",
                "HIGH"));
        insights.add(new AddictionInsight("RELATIONSHIPS", "👁️", "Objectification Rewiring",
                "The brain learns to see people as objects rather than full human beings. This creates a comparison mindset that makes real-world relationships feel inadequate and destroys genuine intimacy.",
                "HIGH"));
        insights.add(new AddictionInsight("RELATIONSHIPS", "😰", "Social Anxiety Amplified",
                "Shame, low self-worth, and dopamine-driven social withdrawal combine to create severe social anxiety. Men avoid social situations, eye contact, and romantic pursuit — not from shyness but from addiction shame.",
                "HIGH"));

        // ── WORLD_STATS category ──
        insights.add(new AddictionInsight("WORLD_STATS", "🌍", "40 Million Daily Visitors",
                "40 million Americans visit pornographic websites every day. It is the most consumed type of content on the internet globally — more than news, social media, or entertainment platforms combined.",
                "MEDIUM"));
        insights.add(new AddictionInsight("WORLD_STATS", "👦", "Average First Exposure: Age 11",
                "The average age of first pornography exposure is 11 years old. Adolescent brains are in critical development stages — early exposure creates deep addiction pathways before the prefrontal cortex is even formed.",
                "CRITICAL"));
        insights.add(new AddictionInsight("WORLD_STATS", "💑", "56% of Divorces Cite Porn",
                "56% of divorce cases in the United States cite one partner's pornography use as a major contributing factor. Porn addiction destroys real-world intimacy at a societal scale.",
                "HIGH"));
        insights.add(new AddictionInsight("WORLD_STATS", "📊", "Only 3% Reach Day 90",
                "Based on NoFap community data (n=500,000+), only approximately 3% of those who attempt the challenge reach Day 90. Reaching this milestone places you in an elite minority of self-disciplined men.",
                "MEDIUM"));
        insights.add(new AddictionInsight("WORLD_STATS", "⏱️", "Average Relapse: Day 5",
                "The average relapse day globally is Day 5. The first week is the hardest neurological battle. If you can make it past Day 7, your success rate increases dramatically.",
                "MEDIUM"));
        insights.add(new AddictionInsight("WORLD_STATS", "📈", "34% Productivity Increase",
                "A survey of 10,000 men who completed 30+ day streaks reported an average 34% self-reported increase in work productivity, focus, and daily output. The correlation between abstinence and performance is consistent.",
                "MEDIUM"));

        return insights;
    }

    private List<String> worldStats() {
        return List.of(
                "70% of men relapse before Day 7 — you're already beating the odds",
                "Only 15% of challengers reach Day 30",
                "Only 3% reach Day 90 — elite territory",
                "21% testosterone increase documented at Day 21 (Jiangsu University, 2003)",
                "Average global relapse day: Day 5 — you've outlasted most already",
                "Men with 30+ day streaks report 34% higher productivity",
                "Brain scans of porn addicts mirror cocaine addicts (Cambridge, 2014)",
                "Dopamine receptors take 14–21 days to upregulate after chronic use"
        );
    }
}
