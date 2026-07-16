package com.thesystem.dto;

/**
 * Phase 2 — one day on the mood-trend line chart. `mood` is the average of the
 * available morning/evening mood scores for that day (1–10).
 */
public record MoodPointDTO(
        String date,
        double mood,
        Integer moodMorning,
        Integer moodEvening
) {}

