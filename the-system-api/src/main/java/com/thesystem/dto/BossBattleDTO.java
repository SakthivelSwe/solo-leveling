package com.thesystem.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record BossBattleDTO(
        Long id,
        Long playerId,
        String topic,
        String difficulty,
        List<Map<String, Object>> questions,
        Integer score,
        int xpEarned,
        LocalDateTime startedAt,
        LocalDateTime completedAt
) {}

