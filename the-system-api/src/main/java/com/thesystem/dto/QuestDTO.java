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
        boolean isRecoveryQuest
) {}

