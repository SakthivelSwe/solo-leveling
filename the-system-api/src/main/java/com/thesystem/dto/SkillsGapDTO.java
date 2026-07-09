package com.thesystem.dto;

import java.util.List;

public record SkillsGapDTO(List<SkillGapItem> items) {

    public record SkillGapItem(
            String skillName,
            int current,
            int target,
            int gap,
            String urgency // CRITICAL, HIGH, ON_TRACK
    ) {}
}

