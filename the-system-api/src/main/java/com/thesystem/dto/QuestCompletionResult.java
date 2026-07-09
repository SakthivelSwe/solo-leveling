package com.thesystem.dto;

import java.util.List;

public record QuestCompletionResult(
        String questKey,
        String questLabel,
        int xpGained,
        boolean leveledUp,
        int newLevel,
        String newRank,
        boolean rankChanged,
        StatsDTO stats,
        List<String> statsGained,
        List<AchievementDTO> newAchievements
) {}

