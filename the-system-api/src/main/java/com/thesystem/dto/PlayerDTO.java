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
        String equippedTitle
) {}

