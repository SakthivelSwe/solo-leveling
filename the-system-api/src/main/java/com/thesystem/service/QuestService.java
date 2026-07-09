package com.thesystem.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.thesystem.dto.*;
import com.thesystem.entity.*;
import com.thesystem.exception.ApiException;
import com.thesystem.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class QuestService {

    private final QuestRepository questRepository;
    private final QuestCompletionRepository completionRepository;
    private final PlayerRepository playerRepository;
    private final PlayerStatsRepository statsRepository;
    private final PlayerSkillRepository skillRepository;
    private final LevelService levelService;
    private final AchievementService achievementService;
    private final SelfDoubtEvidenceRepository evidenceRepository;
    private final SseService sseService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public QuestService(QuestRepository questRepository,
                        QuestCompletionRepository completionRepository,
                        PlayerRepository playerRepository,
                        PlayerStatsRepository statsRepository,
                        PlayerSkillRepository skillRepository,
                        LevelService levelService,
                        AchievementService achievementService,
                        SelfDoubtEvidenceRepository evidenceRepository,
                        SseService sseService) {
        this.questRepository = questRepository;
        this.completionRepository = completionRepository;
        this.playerRepository = playerRepository;
        this.statsRepository = statsRepository;
        this.skillRepository = skillRepository;
        this.levelService = levelService;
        this.achievementService = achievementService;
        this.evidenceRepository = evidenceRepository;
        this.sseService = sseService;
    }

    public List<QuestDTO> getTodayQuests(Long playerId) {
        LocalDate today = LocalDate.now();
        Set<Long> completedIds = completionRepository
                .findByPlayerIdAndCompletedAt(playerId, today).stream()
                .map(QuestCompletion::getQuestId)
                .collect(Collectors.toSet());

        return questRepository.findByActiveTrueOrderByCategoryAscXpRewardDesc().stream()
                .map(q -> toDto(q, completedIds.contains(q.getId())))
                .collect(Collectors.toList());
    }

    @Transactional
    public QuestCompletionResult completeQuest(Long playerId, String questKey) {
        Quest quest = questRepository.findByQuestKey(questKey)
                .orElseThrow(() -> new ApiException("Quest not found: " + questKey, HttpStatus.NOT_FOUND));

        LocalDate today = LocalDate.now();
        if (completionRepository.existsByPlayerIdAndQuestIdAndCompletedAt(playerId, quest.getId(), today)) {
            throw new ApiException("Quest already completed today", HttpStatus.CONFLICT);
        }

        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new ApiException("Player not found", HttpStatus.NOT_FOUND));

        // Award XP
        int xp = quest.getXpReward();
        player.setCurrentXp(player.getCurrentXp() + xp);
        player.setTotalXp(player.getTotalXp() + xp);

        // Apply stat boosts
        PlayerStats stats = statsRepository.findByPlayerId(playerId)
                .orElseThrow(() -> new ApiException("Stats not found", HttpStatus.NOT_FOUND));
        List<String> statsGained = applyStatBoosts(stats, quest.getStatBoosts());
        statsRepository.save(stats);

        // Apply skill boosts
        applySkillBoosts(playerId, quest.getSkillBoosts());

        // Level up check
        LevelUpDTO levelUp = levelService.checkLevelUp(player);
        playerRepository.save(player);

        // Save completion
        completionRepository.save(new QuestCompletion(playerId, quest.getId(), today, xp));

        // Evaluate achievements
        List<AchievementDTO> newAchievements = achievementService.evaluate(player);

        StatsDTO statsDto = new StatsDTO(stats.getStrength(), stats.getIntelligence(),
                stats.getVitality(), stats.getAgility(), stats.getPerception(), stats.getHor());

        // Real-time: push the updated player state to every live tab of this Hunter.
        sseService.send(playerId, "player-update", Map.of(
                "currentXp", player.getCurrentXp(),
                "totalXp", player.getTotalXp(),
                "level", player.getLevel(),
                "rankLevel", player.getRankLevel(),
                "hp", player.getHp(),
                "maxHp", player.getMaxHp(),
                "questKey", quest.getQuestKey(),
                "xpGained", xp,
                "leveledUp", levelUp.leveledUp()));

        return new QuestCompletionResult(
                quest.getQuestKey(), quest.getLabel(), xp,
                levelUp.leveledUp(), levelUp.newLevel(), levelUp.newRank(), levelUp.rankChanged(),
                statsDto, statsGained, newAchievements);
    }

    private List<String> applyStatBoosts(PlayerStats stats, String json) {
        List<String> gained = new ArrayList<>();
        Map<String, Integer> boosts = parseMap(json);
        boosts.forEach((key, val) -> {
            switch (key.toUpperCase()) {
                case "STR" -> stats.setStrength(stats.getStrength() + val);
                case "INT" -> stats.setIntelligence(stats.getIntelligence() + val);
                case "VIT" -> stats.setVitality(stats.getVitality() + val);
                case "AGI" -> stats.setAgility(stats.getAgility() + val);
                case "PER" -> stats.setPerception(stats.getPerception() + val);
                case "HOR" -> stats.setHor(stats.getHor() + val);
                default -> { return; }
            }
            gained.add(key.toUpperCase() + " +" + val);
        });
        return gained;
    }

    private void applySkillBoosts(Long playerId, String json) {
        Map<String, Integer> boosts = parseMap(json);
        boosts.forEach((skillName, val) -> {
            PlayerSkill skill = skillRepository
                    .findByPlayerIdAndSkillName(playerId, skillName)
                    .orElseGet(() -> new PlayerSkill(playerId, skillName, 0));
            int newPct = Math.min(100, skill.getSkillPct() + val);
            skill.setSkillPct(newPct);
            skillRepository.save(skill);
        });
    }

    private Map<String, Integer> parseMap(String json) {
        if (json == null || json.isBlank()) return Collections.emptyMap();
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Integer>>() {});
        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }

    /**
     * Adds a permanent "evidence against self-doubt" entry when the player wins a
     * meaningful skill/discipline quest. Surfaced by Mind OS when mood is low.
     */
    private void recordEvidence(Long playerId, Quest quest) {
        String key = quest.getQuestKey();
        String evidence = switch (key) {
            case "CODE_NO_AI", "FIRST_NO_AI" -> "Coded without AI assistance — pure skill improving.";
            case "LEETCODE", "FIRST_LEETCODE" -> "Solved a LeetCode problem — DSA getting stronger.";
            case "SELF_DEBUG" -> "Debugged a problem myself before reaching for AI.";
            case "ENGLISH", "FIRST_ENGLISH" -> "Practiced English speaking — communication improving.";
            case "EXERCISE", "FIRST_GYM" -> "Trained my body — discipline over comfort.";
            default -> null;
        };
        if (evidence != null) {
            String category = switch (key) {
                case "EXERCISE", "FIRST_GYM" -> "HEALTH";
                case "ENGLISH", "FIRST_ENGLISH" -> "SOCIAL";
                default -> "SKILL";
            };
            evidenceRepository.save(new SelfDoubtEvidence(playerId, evidence, category));
        }
    }

    public QuestDTO toDto(Quest q, boolean completed) {
        return new QuestDTO(q.getId(), q.getQuestKey(), q.getLabel(), q.getCategory().name(),
                q.getXpReward(), q.getStatBoosts(), q.getSkillBoosts(), completed);
    }
}

