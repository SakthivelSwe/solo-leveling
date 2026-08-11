package com.thesystem.dto;

public record PlayerDTO(
        Long id,
        String username,
        String displayName,
        String email,
        String rankLevel,
        int level,
        int currentXp,
        int totalXp,
        int xpToNextLevel,
        int hp,
        int maxHp,
        String equippedTitle,
        boolean inPenaltyZone,
        String penaltyZoneEndTime,
        String createdAt,
        int systemGold,
        boolean onboardingComplete,
        /** The player's awakened class (e.g. "SHADOW_MONARCH") — set on Job Change quest completion. */
        String archetype,
        /** Today's morning energy score (0–100) — drives XP multiplier in QuestService. */
        int currentEnergy
) {}


