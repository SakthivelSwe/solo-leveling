package com.thesystem.dto;

/** Response payload after completing a habit. */
public record HabitCompletionResult(
        Long habitId,
        String habitName,
        int xpGained,
        int newCurrentStreak,
        int newLongestStreak,
        boolean twoMinute,
        boolean keystone,
        boolean leveledUp,
        int newLevel,
        String newRank,
        boolean rankChanged,
        String systemMessage
) {}

