package com.thesystem.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request body for creating a custom player quest.
 * XP defaults: DAILY=50, WEEKLY=150, MONTHLY=300 (Option C — pre-filled, user can change).
 * Input validation prevents oversized payloads and invalid XP values.
 */
public record CustomQuestRequest(
        @NotBlank(message = "Quest label is required")
        @Size(min = 1, max = 200, message = "Quest label must be between 1 and 200 characters")
        String label,

        /** DAILY | SKILL | TESTOSTERONE | WEEKLY | MONTHLY */
        @NotBlank(message = "Category is required")
        String category,

        /** Optional — defaults applied server-side based on timeType */
        Integer xpReward,

        /** Optional Map e.g. {"STR":2,"VIT":1} */
        java.util.Map<String, Integer> statBoosts
) {}
