package com.thesystem.dto;

import java.util.List;

public record LevelUpDTO(
        boolean leveledUp,
        int newLevel,
        String newRank,
        boolean rankChanged
) {}

