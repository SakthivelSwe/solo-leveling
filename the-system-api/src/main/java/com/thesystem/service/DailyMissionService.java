package com.thesystem.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.thesystem.dto.DailyMissionDTO;
import com.thesystem.dto.QuestDTO;
import com.thesystem.entity.DailyMission;
import com.thesystem.entity.PlayerStats;
import com.thesystem.entity.Quest;
import com.thesystem.exception.ApiException;
import com.thesystem.repository.DailyMissionRepository;
import com.thesystem.repository.PlayerStatsRepository;
import com.thesystem.repository.QuestCompletionRepository;
import com.thesystem.repository.QuestRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Daily Mission Generator — reduces decision fatigue by selecting 5 main + 3 side quests
 * per day based on the player's weakest stats.
 *
 * Algorithm:
 *  1. Load player stats and find the 2 weakest.
 *  2. Critical quests (isCritical=true) always go into main quests (up to 5 total).
 *  3. Remaining main quest slots filled from stat-targeted quests for weakest stat.
 *  4. 3 side quests selected from supporting/health/body quests for second-weakest stat.
 */
@Service
public class DailyMissionService {

    private static final int MAIN_QUEST_COUNT = 5;
    private static final int SIDE_QUEST_COUNT = 3;

    private final DailyMissionRepository missionRepository;
    private final QuestRepository questRepository;
    private final QuestCompletionRepository completionRepository;
    private final PlayerStatsRepository statsRepository;
    private final QuestService questService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public DailyMissionService(DailyMissionRepository missionRepository,
                               QuestRepository questRepository,
                               QuestCompletionRepository completionRepository,
                               PlayerStatsRepository statsRepository,
                               QuestService questService) {
        this.missionRepository = missionRepository;
        this.questRepository = questRepository;
        this.completionRepository = completionRepository;
        this.statsRepository = statsRepository;
        this.questService = questService;
    }

    /**
     * Returns today's mission set, generating it if it doesn't exist yet.
     * Idempotent — calling multiple times returns the same set for the day.
     */
    @Transactional
    public DailyMissionDTO getTodayMissions(Long playerId) {
        LocalDate today = LocalDate.now();
        DailyMission mission = missionRepository.findByPlayerIdAndMissionDate(playerId, today)
                .orElseGet(() -> generate(playerId, today));
        return toDto(playerId, mission, today);
    }

    /**
     * Force-regenerates today's mission set (can be called once per day).
     * Useful if the player's stats changed significantly during the day.
     */
    @Transactional
    public DailyMissionDTO regenerate(Long playerId) {
        LocalDate today = LocalDate.now();
        missionRepository.findByPlayerIdAndMissionDate(playerId, today)
                .ifPresent(missionRepository::delete);
        DailyMission mission = generate(playerId, today);
        return toDto(playerId, mission, today);
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private DailyMission generate(Long playerId, LocalDate date) {
        PlayerStats stats = statsRepository.findByPlayerId(playerId)
                .orElseThrow(() -> new ApiException("Stats not found", HttpStatus.NOT_FOUND));

        // Find weakest and second-weakest stat
        String weakest = weakestStat(stats);
        String secondWeakest = secondWeakestStat(stats, weakest);

        // Use player-scoped query: includes custom daily quests, excludes MILESTONE/SIDE
        List<Quest> allQuests = questRepository.findDailyQuestsForPlayer(playerId);

        // Step 1: Always-include critical quests (CODE_NO_AI, LEETCODE, ENGLISH, etc.)
        List<Quest> criticalQuests = allQuests.stream()
                .filter(Quest::isCritical)
                .sorted(Comparator.comparingInt(Quest::getPriority).reversed())
                .limit(MAIN_QUEST_COUNT)
                .collect(Collectors.toList());

        // Step 2: Fill remaining main quest slots with stat-targeted quests
        Set<Long> usedIds = criticalQuests.stream().map(Quest::getId).collect(Collectors.toSet());
        List<Quest> statTargeted = allQuests.stream()
                .filter(q -> !usedIds.contains(q.getId()))
                .filter(q -> questMatchesStat(q, weakest))
                .sorted(Comparator.comparingInt(Quest::getPriority).reversed())
                .limit(MAIN_QUEST_COUNT - criticalQuests.size())
                .collect(Collectors.toList());

        List<Quest> mainQuests = new ArrayList<>();
        mainQuests.addAll(criticalQuests);
        mainQuests.addAll(statTargeted);
        usedIds.addAll(statTargeted.stream().map(Quest::getId).collect(Collectors.toSet()));

        // Step 3: Side quests from second-weakest stat (recovery/support quests)
        List<Quest> sideQuests = allQuests.stream()
                .filter(q -> !usedIds.contains(q.getId()))
                .filter(q -> questMatchesStat(q, secondWeakest) || q.isRecoveryQuest())
                .sorted(Comparator.comparingInt(Quest::getPriority).reversed())
                .limit(SIDE_QUEST_COUNT)
                .collect(Collectors.toList());

        DailyMission mission = new DailyMission();
        mission.setPlayerId(playerId);
        mission.setMissionDate(date);
        mission.setMainQuestKeys(toJson(mainQuests.stream().map(Quest::getQuestKey).collect(Collectors.toList())));
        mission.setSideQuestKeys(toJson(sideQuests.stream().map(Quest::getQuestKey).collect(Collectors.toList())));
        mission.setFocusStat(weakest);
        mission.setFocusArea(statToArea(weakest));
        return missionRepository.save(mission);
    }

    private DailyMissionDTO toDto(Long playerId, DailyMission mission, LocalDate today) {
        Set<Long> completedIds = completionRepository.findByPlayerIdAndCompletedAt(playerId, today)
                .stream().map(c -> c.getQuestId()).collect(Collectors.toSet());

        List<String> mainKeys = parseKeys(mission.getMainQuestKeys());
        List<String> sideKeys = parseKeys(mission.getSideQuestKeys());

        List<QuestDTO> mainQuests = mainKeys.stream()
                .map(key -> questRepository.findByQuestKey(key).orElse(null))
                .filter(Objects::nonNull)
                .map(q -> questService.toDto(q, completedIds.contains(q.getId())))
                .collect(Collectors.toList());

        List<QuestDTO> sideQuests = sideKeys.stream()
                .map(key -> questRepository.findByQuestKey(key).orElse(null))
                .filter(Objects::nonNull)
                .map(q -> questService.toDto(q, completedIds.contains(q.getId())))
                .collect(Collectors.toList());

        String directive = buildDirective(mission.getFocusStat(), mission.getFocusArea());
        return new DailyMissionDTO(mainQuests, sideQuests, mission.getFocusStat(),
                mission.getFocusArea(), today.toString(), directive);
    }

    /** Maps a stat name to quest keys that train that stat. */
    private boolean questMatchesStat(Quest q, String stat) {
        if (stat == null || q.getStatBoosts() == null) return false;
        return q.getStatBoosts().toUpperCase().contains(stat.toUpperCase());
    }

    private String weakestStat(PlayerStats s) {
        Map<String, Integer> stats = new LinkedHashMap<>();
        stats.put("STR", s.getStrength());
        stats.put("INT", s.getIntelligence());
        stats.put("VIT", s.getVitality());
        stats.put("AGI", s.getAgility());
        stats.put("PER", s.getPerception());
        stats.put("HOR", s.getHor());
        return stats.entrySet().stream()
                .min(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey).orElse("INT");
    }

    private String secondWeakestStat(PlayerStats s, String weakest) {
        Map<String, Integer> stats = new LinkedHashMap<>();
        stats.put("STR", s.getStrength());
        stats.put("INT", s.getIntelligence());
        stats.put("VIT", s.getVitality());
        stats.put("AGI", s.getAgility());
        stats.put("PER", s.getPerception());
        stats.put("HOR", s.getHor());
        return stats.entrySet().stream()
                .filter(e -> !e.getKey().equals(weakest))
                .min(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey).orElse("VIT");
    }

    private String statToArea(String stat) {
        return switch (stat) {
            case "INT", "PER" -> "CAREER";
            case "AGI"        -> "ENGLISH";
            case "STR", "HOR" -> "HEALTH";
            case "VIT"        -> "VITALITY";
            default           -> "GENERAL";
        };
    }

    private String buildDirective(String stat, String area) {
        return switch (area) {
            case "CAREER"    -> "◈ Today's focus: CODE. Your INT stat is weakest. LeetCode and system design are mandatory.";
            case "ENGLISH"   -> "◈ Today's focus: SPEAK. Your AGI is weakest. English practice and mock interview are priority.";
            case "HEALTH"    -> "◈ Today's focus: BODY. Physical discipline first. Exercise and cold shower must not be skipped.";
            case "VITALITY"  -> "◈ Today's focus: RECOVER. Water. Breakfast. Sleep before 23:00. The body needs fuel.";
            default          -> "◈ All systems operational. Execute all missions. No excuses.";
        };
    }

    private String toJson(List<String> list) {
        try { return objectMapper.writeValueAsString(list); }
        catch (Exception e) { return "[]"; }
    }

    private List<String> parseKeys(String json) {
        if (json == null || json.isBlank()) return List.of();
        try { return objectMapper.readValue(json, new TypeReference<List<String>>() {}); }
        catch (Exception e) { return List.of(); }
    }
}
