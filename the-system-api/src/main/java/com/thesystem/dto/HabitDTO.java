package com.thesystem.dto;

import java.util.List;

/** DTO for a Habit including live-computed streak + identity metrics. */
public record HabitDTO(
        Long id,
        String name,
        String identityTag,
        String cue,
        String craving,
        String routine,
        String reward,
        String twoMinuteVersion,
        Long stackAfterHabitId,
        String cueTime,
        String cueLocation,
        int difficulty,
        boolean keystone,
        int activeDays,
        boolean archived,
        // live computed
        boolean completedToday,
        int currentStreak,
        int longestStreak,
        int totalCompletions,
        double consistencyPct,   // last 30 days
        double masteryPct,       // 0..100 based on 66-day cycle
        List<Integer> last30     // 0/1/2 per day (0 miss, 1 done, 2 two-minute)
) {}

