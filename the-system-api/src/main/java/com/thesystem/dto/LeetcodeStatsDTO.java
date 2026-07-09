package com.thesystem.dto;

public record LeetcodeStatsDTO(
        long total,
        long easy,
        long medium,
        long hard,
        int streak
) {}

