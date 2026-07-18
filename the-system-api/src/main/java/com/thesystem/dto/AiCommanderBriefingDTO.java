package com.thesystem.dto;

import java.util.List;

public record AiCommanderBriefingDTO(
    String greeting,
    String yesterdayRecap,
    List<String> todayPriorities,
    String feedback,
    int estimatedCompletionPct,
    String expectedLevelUp
) {}
