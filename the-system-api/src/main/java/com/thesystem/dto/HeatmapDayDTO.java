package com.thesystem.dto;

/**
 * One cell in the consistency heatmap (GitHub-style).
 * intensity: 0 = none, 1 = 1-3, 2 = 4-6, 3 = 7-9, 4 = 10+ quests.
 */
public record HeatmapDayDTO(
        String date,
        int count,
        int xp,
        int intensity
) {}

