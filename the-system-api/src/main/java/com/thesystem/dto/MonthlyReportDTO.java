package com.thesystem.dto;

/**
 * The System's monthly report card — an at-a-glance verdict on the Hunter's month,
 * measured against the D → C → B rank targets.
 */
public record MonthlyReportDTO(
        String monthLabel,
        int daysActive,
        int daysElapsed,
        int totalQuestsMonth,
        int totalXpMonth,
        int perfectDays,
        int currentStreak,
        int longestStreak,
        double avgQuestsPerActiveDay,
        String bestStat,
        String weakestStat,
        String rankLevel,
        int level,
        int totalXp,
        String rankTarget,
        String systemVerdict
) {}

