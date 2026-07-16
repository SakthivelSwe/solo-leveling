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
    private final DopamineService dopamineService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public QuestService(QuestRepository questRepository,
                        QuestCompletionRepository completionRepository,
                        PlayerRepository playerRepository,
                        PlayerStatsRepository statsRepository,
                        PlayerSkillRepository skillRepository,
                        LevelService levelService,
                        AchievementService achievementService,
                        SelfDoubtEvidenceRepository evidenceRepository,
                        SseService sseService,
                        DopamineService dopamineService) {
        this.questRepository = questRepository;
        this.completionRepository = completionRepository;
        this.playerRepository = playerRepository;
        this.statsRepository = statsRepository;
        this.skillRepository = skillRepository;
        this.levelService = levelService;
        this.achievementService = achievementService;
        this.evidenceRepository = evidenceRepository;
        this.sseService = sseService;
        this.dopamineService = dopamineService;
    }

    public List<QuestDTO> getTodayQuests(Long playerId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new ApiException("Player not found", HttpStatus.NOT_FOUND));
        LocalDate today = LocalDate.now();
        Set<Long> completedIds = completionRepository
                .findByPlayerIdAndCompletedAt(playerId, today).stream()
                .map(QuestCompletion::getQuestId)
                .collect(Collectors.toSet());

        List<QuestDTO> dtos = questRepository.findByActiveTrueOrderByCategoryAscXpRewardDesc().stream()
                .map(q -> toDto(q, completedIds.contains(q.getId()), player))
                .collect(Collectors.toList());

        if (player.isInPenaltyZone()) {
            // Dynamic Penalty Quest injected at the top
            dtos.add(0, new QuestDTO(-1L, "PENALTY_SURVIVAL", "[PENALTY] Survival: 20 Burpees or No Screen Time for 1 Hour", 
                     "DAILY", 0, null, null, false, 999, true, 0, false));
        }

        return dtos;
    }

    @Transactional
    public QuestCompletionResult completeQuest(Long playerId, String questKey) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new ApiException("Player not found", HttpStatus.NOT_FOUND));

        if ("PENALTY_SURVIVAL".equals(questKey)) {
            if (!player.isInPenaltyZone()) {
                throw new ApiException("Not in penalty zone", HttpStatus.BAD_REQUEST);
            }
            player.setInPenaltyZone(false);
            playerRepository.save(player);
            sseService.send(player.getId(), "player-update", java.util.Map.of("inPenaltyZone", false));
            
            PlayerStats stats = statsRepository.findByPlayerId(playerId)
                .orElseThrow(() -> new ApiException("Stats not found", HttpStatus.NOT_FOUND));
            StatsDTO statsDto = new StatsDTO(stats.getStrength(), stats.getIntelligence(),
                stats.getVitality(), stats.getAgility(), stats.getPerception(), stats.getHor());
            
            return new QuestCompletionResult(questKey, "Penalty Survival", 0, false, player.getLevel(), player.getRankLevel(), false, statsDto, List.of(), List.of());
        }

        Quest quest = questRepository.findByQuestKey(questKey)
                .orElseThrow(() -> new ApiException("Quest not found: " + questKey, HttpStatus.NOT_FOUND));

        LocalDate today = LocalDate.now();
        if (completionRepository.existsByPlayerIdAndQuestIdAndCompletedAt(playerId, quest.getId(), today)) {
            throw new ApiException("Quest already completed today", HttpStatus.CONFLICT);
        }

        // Award XP — apply compound energy × dopamine/focus multipliers.
        // Low energy (sleep-deprived) reduces XP. High dopamine (reels, porn) further reduces it.
        // On a perfect day (high energy + clean dopamine): +10% bonus.
        int baseXp = getDynamicXp(quest, player);
        int energy = player.getCurrentEnergy();
        double energyMultiplier = energy < 40 ? 0.80
                : energy < 60 ? 0.90
                : energy >= 80 ? 1.10 : 1.0;
        double focusMultiplier = dopamineService.getTodayFocusMultiplier(playerId);
        int xp = (int) Math.round(baseXp * energyMultiplier * focusMultiplier);
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
            // Increment mastery percentage (capped 100)
            int newPct = Math.min(100, skill.getSkillPct() + val);
            skill.setSkillPct(newPct);
            // Accumulate skill-specific XP: each boost point = 10 skill XP
            skill.setSkillXp(skill.getSkillXp() + (val * 10));
            // Recompute RPG level and rank from accumulated XP
            skill.recalculateLevelAndRank();
            skill.setUpdatedAt(java.time.LocalDateTime.now());
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
        return toDto(q, completed, null);
    }

    public QuestDTO toDto(Quest q, boolean completed, Player player) {
        String label = q.getLabel();
        int xpReward = getDynamicXp(q, player);
        
        if ("COURAGE_OF_THE_WEAK".equals(q.getQuestKey()) && player != null) {
            int level = player.getLevel();
            if (level <= 5) {
                label = "[DAILY] Secret Quest: Courage of the Weak (10 Push-ups, 10 Sit-ups, 10 Squats, 1km Walk)";
            } else if (level <= 10) {
                label = "[DAILY] Secret Quest: Courage of the Weak (25 Push-ups, 25 Sit-ups, 25 Squats, 2.5km Jog)";
            } else if (level <= 20) {
                label = "[DAILY] Secret Quest: Courage of the Weak (50 Push-ups, 50 Sit-ups, 50 Squats, 5km Run)";
            } else {
                label = "[DAILY] Secret Quest: Courage of the Weak (100 Push-ups, 100 Sit-ups, 100 Squats, 10km Run)";
            }
        }

        return new QuestDTO(q.getId(), q.getQuestKey(), label, q.getCategory().name(),
                xpReward, q.getStatBoosts(), q.getSkillBoosts(), completed,
                q.getPriority(), q.isCritical(), q.getBossDamage(), q.isRecoveryQuest());
    }

    private int getDynamicXp(Quest q, Player p) {
        if ("COURAGE_OF_THE_WEAK".equals(q.getQuestKey()) && p != null) {
            int level = p.getLevel();
            if (level <= 5) return 50;
            if (level <= 10) return 100;
            if (level <= 20) return 150;
            return 200;
        }
        return q.getXpReward();
    }
}

