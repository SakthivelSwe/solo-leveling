package com.thesystem.dto;

/**
 * Phase 2 — one night of sleep derived from a HealthLog's bedtime/wake time.
 * `durationMinutes` is computed server-side (handles crossing midnight).
 */
public record SleepEntryDTO(
        String date,
        String bedtime,      // "HH:mm"
        String wakeTime,     // "HH:mm"
        long durationMinutes,
        Integer quality
) {}

