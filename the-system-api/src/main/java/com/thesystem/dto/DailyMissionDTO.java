package com.thesystem.dto;

import java.util.List;

/**
 * The daily mission set: 5 main quests + 3 side quests.
 * Critical quests are always in main; side quests support the focus area.
 */
public record DailyMissionDTO(
        List<QuestDTO> mainQuests,
        List<QuestDTO> sideQuests,
        String focusStat,
        String focusArea,
        String missionDate,
        String directive
) {}
