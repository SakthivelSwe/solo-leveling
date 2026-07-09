package com.thesystem.dto;

public record DayProgressDTO(
        String date,
        String dayLabel,
        int questsCompleted,
        int xpEarned,
        boolean isToday
) {}

