package com.thesystem.dto;

public record AchievementDTO(
        Long id,
        String achievementKey,
        String title,
        String description,
        String unlockedAt
) {}

