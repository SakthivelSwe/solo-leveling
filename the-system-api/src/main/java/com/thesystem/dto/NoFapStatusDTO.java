package com.thesystem.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * Full No Fap Challenge status response.
 *
 * Streak is computed from DopamineLog.pornViewed == false on consecutive days.
 * No new DB table needed — reuses the existing dopamine_logs table.
 */
@Getter
@Setter
public class NoFapStatusDTO {

    // ── Streak ──────────────────────────────────────────────────────────────
    private int currentStreak;
    private int longestStreak;
    private boolean todayClean;
    private boolean todayConfirmed;

    // ── Milestone ────────────────────────────────────────────────────────────
    /** Current milestone tier: 7, 30, 90, or 365 */
    private int milestone;
    /** Next milestone to aim for */
    private int nextMilestone;
    /** Days remaining until next milestone */
    private int daysToNextMilestone;

    // ── Phase ────────────────────────────────────────────────────────────────
    /** Phase name: "Rewiring" | "Clarity" | "Transformation" | "Mastery" */
    private String phaseName;
    /** Phase emoji icon: 🧠 | ⚡ | 🔥 | 👑 */
    private String phaseIcon;
    /** Phase color hex for UI theming */
    private String phaseColor;

    // ── Today's science ──────────────────────────────────────────────────────
    private String scienceTitle;
    private String scienceFact;
    private String scienceCategory;

    // ── Full 90-day science timeline ─────────────────────────────────────────
    private List<ScienceDayCard> dayByDayScience;

    // ── Addiction impact insights ─────────────────────────────────────────────
    private List<AddictionInsight> addictionInsights;

    // ── World statistics ─────────────────────────────────────────────────────
    private List<String> worldStats;

    // ── XP bonus ─────────────────────────────────────────────────────────────
    /** Extra XP bonus % earned this streak: 5% per 7 clean days, capped at 50% */
    private double xpBonusPct;

    // ── System verdict ───────────────────────────────────────────────────────
    private String systemVerdict;

    // ── 90-day heatmap history ────────────────────────────────────────────────
    /** Index 0 = 89 days ago, last element = today. null = no data, true = clean, false = relapse */
    private List<Boolean> last90Days;

    // ────────────────────────────────────────────────────────────────────────
    // Nested types
    // ────────────────────────────────────────────────────────────────────────

    @Getter
    @Setter
    public static class ScienceDayCard {
        private int day;
        /** Phase: REWIRING | CLARITY | TRANSFORMATION | MASTERY */
        private String phase;
        private String icon;
        private String title;
        private String description;
        /** DOPAMINE | TESTOSTERONE | MEMORY | FOCUS | CONFIDENCE | SLEEP | NEUROPLASTICITY */
        private String category;

        public ScienceDayCard() {}

        public ScienceDayCard(int day, String phase, String icon,
                              String title, String description, String category) {
            this.day = day;
            this.phase = phase;
            this.icon = icon;
            this.title = title;
            this.description = description;
            this.category = category;
        }
    }

    @Getter
    @Setter
    public static class AddictionInsight {
        /** BRAIN | TESTOSTERONE | RELATIONSHIPS | WORLD_STATS */
        private String category;
        private String icon;
        private String title;
        private String description;
        /** LOW | MEDIUM | HIGH | CRITICAL */
        private String severity;

        public AddictionInsight() {}

        public AddictionInsight(String category, String icon, String title,
                                String description, String severity) {
            this.category = category;
            this.icon = icon;
            this.title = title;
            this.description = description;
            this.severity = severity;
        }
    }
}
