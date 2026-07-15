package com.thesystem.dto;

import java.util.List;
import java.util.Map;

/**
 * Interview readiness score broken down by skill area.
 * Overall score drives a system verdict indicating readiness level.
 */
public record InterviewReadinessDTO(
        Map<String, Integer> perSkill,   // e.g., { "Java": 85, "Spring": 80, ... }
        int overallPct,
        String verdict,
        List<String> weakAreas,
        List<String> strongAreas,
        int codingHours                   // total deep work coding hours as practical evidence
) {}
