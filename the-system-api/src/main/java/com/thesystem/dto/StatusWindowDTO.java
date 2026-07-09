package com.thesystem.dto;

import java.util.List;

public record StatusWindowDTO(
        PlayerDTO player,
        StatsDTO stats,
        List<PlayerSkillDTO> skills,
        List<QuestDTO> todayQuests,
        List<DayProgressDTO> weeklyProgress,
        List<AchievementDTO> achievements,
        int completedToday,
        int totalQuests,
        int streak,
        String motivation,
        String systemQuote
) {}

