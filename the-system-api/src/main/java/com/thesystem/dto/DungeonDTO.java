package com.thesystem.dto;

public record DungeonDTO(
        String name,
        String bossName,
        int totalHp,
        int currentHp,
        int damageDealt,
        int questsThisWeek,
        int questsToClear,
        boolean cleared,
        boolean justCleared,
        int rewardXp,
        int progressPct,
        String weekStart
) {}

