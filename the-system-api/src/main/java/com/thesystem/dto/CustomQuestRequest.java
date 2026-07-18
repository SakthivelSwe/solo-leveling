package com.thesystem.dto;

/**
 * Request body for creating a custom player quest.
 * XP defaults: DAILY=50, WEEKLY=150, MONTHLY=300 (Option C — pre-filled, user can change).
 */
public record CustomQuestRequest(
        String label,
        /** DAILY | SKILL | TESTOSTERONE | WEEKLY | MONTHLY */
        String category,
        /** Optional — defaults applied server-side based on timeType */
        Integer xpReward,
        /** Optional Map e.g. {"STR":2,"VIT":1} */
        java.util.Map<String, Integer> statBoosts
) {}

