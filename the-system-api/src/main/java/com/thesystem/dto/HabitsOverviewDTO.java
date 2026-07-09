package com.thesystem.dto;

import java.util.List;
import java.util.Map;

/** Aggregated dashboard payload for the Habits view. */
public record HabitsOverviewDTO(
        List<HabitDTO> habits,
        int dueToday,
        int completedToday,
        int longestGlobalStreak,
        int totalCompletions,
        double compoundingFactor,   // 1.01^n over days active
        double decayFactor,         // 0.99^n counterfactual
        Map<String, Integer> identityScores,  // tag -> % (0-100)
        String systemVerdict
) {}

