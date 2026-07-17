package com.thesystem.dto;

public record QuestDTO(
        Long id,
        String questKey,
        String label,
        String category,
        int xpReward,
        String statBoosts,
        String skillBoosts,
        boolean isCompleted,
        int priority,
        boolean isCritical,
        int bossDamage,
        boolean isRecoveryQuest,
        /** DAILY | WEEKLY | MONTHLY | ONE_TIME */
        String timeType,
        /** true if created by the player (can be deleted) */
        boolean isCustom,
        /** For WEEKLY quests: how many times completed this week */
        int weeklyDoneCount,
        /** For MONTHLY quests: how many times completed this month */
        int monthlyDoneCount
) {}

