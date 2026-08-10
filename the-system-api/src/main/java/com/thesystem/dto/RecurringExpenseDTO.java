package com.thesystem.dto;

import java.time.LocalDate;

/**
 * Phase 2A — Recurring expense detection result.
 * Represents a pattern of repeated expenses (e.g., Swiggy, Netflix, Gym).
 */
public record RecurringExpenseDTO(
        String description,
        double estimatedAmount,
        double minAmount,
        double maxAmount,
        int intervalDays,
        LocalDate lastSeen,
        int occurrences,
        double totalSpent,
        String category
) {}
