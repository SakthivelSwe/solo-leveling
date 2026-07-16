package com.thesystem.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public record LearningStatsDTO(
    long totalSessions,
    int totalMinutes,
    int totalHours,
    long totalXpEarned,
    double recallRate,           // percentage 0-100
    int currentLearnStreak,      // consecutive days with at least one session
    int dueRecallsCount,         // how many recalls are overdue
    List<SubjectStat> topSubjects,
    List<DailyMinutes> weeklyActivity
) {
    public record SubjectStat(String subject, long sessions, int totalMinutes) {}
    public record DailyMinutes(LocalDate date, int minutes) {}
}
