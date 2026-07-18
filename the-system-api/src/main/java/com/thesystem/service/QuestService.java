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

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
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

    // ── Quest Lists ────────────────────────────────────────────────────────────

    /**
     * Returns today's DAILY quests for this player.
     * SIDE/MILESTONE quests are EXCLUDED — they live on the Milestones tab.
     * Custom DAILY quests owned by this player are INCLUDED.
     */
    public List<QuestDTO> getTodayQuests(Long playerId) {
        return getQuestsByDate(playerId, LocalDate.now());
    }

    public List<QuestDTO> getQuestsByDate(Long playerId, LocalDate date) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new ApiException("Player not found", HttpStatus.NOT_FOUND));
        Set<Long> completedIds = getCompletedQuestIds(playerId, date);

        List<QuestDTO> dtos = questRepository.findDailyQuestsForPlayer(playerId).stream()
                .map(q -> toDto(q, completedIds.contains(q.getId()), player))
                .collect(Collectors.toList());

        if (player.isInPenaltyZone()) {
            dtos.add(0, new QuestDTO(-1L, "PENALTY_SURVIVAL",
                    "[PENALTY] Survival: 20 Burpees or No Screen Time for 1 Hour",
                    "DAILY", 0, null, null, false, 999, true, 0, false, "DAILY", false, 0, 0));
        }

        return dtos;
    }

    /**
     * Returns all WEEKLY quests for this player with this week's completion counts.
     * Resets every Monday.
     */
    public List<QuestDTO> getWeeklyQuests(Long playerId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new ApiException("Player not found", HttpStatus.NOT_FOUND));
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate weekEnd = today;

        return questRepository.findWeeklyQuestsForPlayer(playerId).stream()
                .map(q -> {
                    long doneCount = completionRepository.countByPlayerIdAndQuestIdAndCompletedAtBetween(
                            playerId, q.getId(), weekStart, weekEnd);
                    boolean isCompleted = doneCount >= 1;
                    QuestDTO dto = toDto(q, isCompleted, player);
                    return new QuestDTO(dto.id(), dto.questKey(), dto.label(), dto.category(),
                            dto.xpReward(), dto.statBoosts(), dto.skillBoosts(), isCompleted,
                            dto.priority(), dto.isCritical(), dto.bossDamage(), dto.isRecoveryQuest(),
                            dto.timeType(), dto.isCustom(), (int) doneCount, 0);
                })
                .collect(Collectors.toList());
    }

    /**
     * Returns all MONTHLY quests for this player with this month's completion counts.
     * Resets on the 1st of each month.
     */
    public List<QuestDTO> getMonthlyQuests(Long playerId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new ApiException("Player not found", HttpStatus.NOT_FOUND));
        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate monthEnd = today;

        return questRepository.findMonthlyQuestsForPlayer(playerId).stream()
                .map(q -> {
                    long doneCount = completionRepository.countByPlayerIdAndQuestIdAndCompletedAtBetween(
                            playerId, q.getId(), monthStart, monthEnd);
                    boolean isCompleted = doneCount >= 1;
                    QuestDTO dto = toDto(q, isCompleted, player);
                    return new QuestDTO(dto.id(), dto.questKey(), dto.label(), dto.category(),
                            dto.xpReward(), dto.statBoosts(), dto.skillBoosts(), isCompleted,
                            dto.priority(), dto.isCritical(), dto.bossDamage(), dto.isRecoveryQuest(),
                            dto.timeType(), dto.isCustom(), 0, (int) doneCount);
                })
                .collect(Collectors.toList());
    }

    /**
     * Returns one-time MILESTONE quests.
     * Already-completed ones are marked done; they still appear (greyed out) for the full achievement view.
     */
    public List<QuestDTO> getMilestoneQuests(Long playerId) {
        Set<Long> completedAllTime = completionRepository.findByPlayerIdOrderByCompletedAtDesc(playerId)
                .stream().map(QuestCompletion::getQuestId).collect(Collectors.toSet());

        return questRepository.findMilestoneQuests().stream()
                .map(q -> toDto(q, completedAllTime.contains(q.getId()), null))
                .collect(Collectors.toList());
    }

    // ── Quest Completion ───────────────────────────────────────────────────────

    @Transactional
    public QuestCompletionResult completeQuest(Long playerId, String questKey) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new ApiException("Player not found", HttpStatus.NOT_FOUND));

        // Special case: Penalty Survival
        if ("PENALTY_SURVIVAL".equals(questKey)) {
            return completePenaltyQuest(player);
        }

        Quest quest = questRepository.findByQuestKey(questKey)
                .orElseThrow(() -> new ApiException("Quest not found: " + questKey, HttpStatus.NOT_FOUND));

        // Ownership check: custom quest must belong to this player (or be a system quest)
        if (quest.isCustom() && quest.getOwnerId() != null && !quest.getOwnerId().equals(playerId)) {
            throw new ApiException("Not your quest", HttpStatus.FORBIDDEN);
        }

        LocalDate today = LocalDate.now();

        // Duplicate completion check — window depends on quest timeType
        checkAlreadyCompleted(playerId, quest, today);

        // XP with energy × dopamine multipliers
        int baseXp = getDynamicXp(quest, player);
        int energy = player.getCurrentEnergy();
        double energyMultiplier = energy < 40 ? 0.80 : energy < 60 ? 0.90 : energy >= 80 ? 1.10 : 1.0;
        double focusMultiplier = dopamineService.getTodayFocusMultiplier(playerId);
        int xp = (int) Math.round(baseXp * energyMultiplier * focusMultiplier);
        
        // Add XP, handle level-up, and send SSE notification
        LevelUpDTO levelUp = levelService.addXp(player, xp, quest.getQuestKey());

        // Stat boosts
        PlayerStats stats = statsRepository.findByPlayerId(playerId)
                .orElseThrow(() -> new ApiException("Stats not found", HttpStatus.NOT_FOUND));
        List<String> statsGained = applyStatBoosts(stats, quest.getStatBoosts());
        statsRepository.save(stats);

        // Skill boosts
        applySkillBoosts(playerId, quest.getSkillBoosts());

        // Save completion
        completionRepository.save(new QuestCompletion(playerId, quest.getId(), today, xp));

        // Evaluate achievements
        List<AchievementDTO> newAchievements = achievementService.evaluate(player);

        // Record self-doubt evidence for key discipline quests
        if (Boolean.TRUE.equals(quest.isRecoveryQuest()) || "COURAGE_OF_THE_WEAK".equals(quest.getQuestKey())) {
            evidenceRepository.save(new com.thesystem.entity.SelfDoubtEvidence(
                    playerId, "Completed discipline quest: " + quest.getLabel(), "CHARACTER"));
        }

        StatsDTO statsDto = new StatsDTO(stats.getStrength(), stats.getIntelligence(),
                stats.getVitality(), stats.getAgility(), stats.getPerception(), stats.getDis());

        return new QuestCompletionResult(
                quest.getQuestKey(), quest.getLabel(), xp,
                levelUp.leveledUp(), levelUp.newLevel(), levelUp.newRank(), levelUp.rankChanged(),
                statsDto, statsGained, newAchievements);
    }

    /**
     * Validates the player hasn't already completed this quest in the relevant window.
     * DAILY → today only
     * WEEKLY → this Monday–today
     * MONTHLY → this 1st–today
     * ONE_TIME/MILESTONE/SIDE → all time (once ever)
     */
    private void checkAlreadyCompleted(Long playerId, Quest quest, LocalDate today) {
        String timeType = quest.getTimeType() != null ? quest.getTimeType() : "DAILY";

        switch (timeType) {
            case "WEEKLY" -> {
                LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                if (completionRepository.existsByPlayerIdAndQuestIdAndCompletedAtBetween(
                        playerId, quest.getId(), weekStart, today)) {
                    throw new ApiException("Quest already completed this week", HttpStatus.CONFLICT);
                }
            }
            case "MONTHLY" -> {
                LocalDate monthStart = today.withDayOfMonth(1);
                if (completionRepository.existsByPlayerIdAndQuestIdAndCompletedAtBetween(
                        playerId, quest.getId(), monthStart, today)) {
                    throw new ApiException("Quest already completed this month", HttpStatus.CONFLICT);
                }
            }
            case "ONE_TIME" -> {
                if (completionRepository.countByPlayerIdAndQuestId(playerId, quest.getId()) > 0) {
                    throw new ApiException("Milestone already achieved", HttpStatus.CONFLICT);
                }
            }
            default -> { // DAILY
                if (quest.isOneTime()) {
                    if (completionRepository.countByPlayerIdAndQuestId(playerId, quest.getId()) > 0) {
                        throw new ApiException("Milestone already achieved", HttpStatus.CONFLICT);
                    }
                } else {
                    if (completionRepository.existsByPlayerIdAndQuestIdAndCompletedAt(
                            playerId, quest.getId(), today)) {
                        throw new ApiException("Quest already completed today", HttpStatus.CONFLICT);
                    }
                }
            }
        }
    }

    // ── Custom Quest CRUD ──────────────────────────────────────────────────────

    /**
     * Creates a player-owned custom quest.
     * XP defaults (Option C): DAILY=50, WEEKLY=150, MONTHLY=300 — pre-filled, user can override.
     */
    @Transactional
    public QuestDTO addCustomQuest(Long playerId, CustomQuestRequest req) {
        if (req.label() == null || req.label().isBlank()) {
            throw new ApiException("Quest label is required", HttpStatus.BAD_REQUEST);
        }

        // Determine category and timeType from the request
        String catStr = req.category() != null ? req.category().toUpperCase() : "DAILY";
        QuestCategory category;
        try { category = QuestCategory.valueOf(catStr); }
        catch (IllegalArgumentException e) { category = QuestCategory.DAILY; }

        String timeType = switch (catStr) {
            case "WEEKLY"  -> "WEEKLY";
            case "MONTHLY" -> "MONTHLY";
            default        -> "DAILY";
        };

        // Default XP per timeType (Option C)
        int xp = req.xpReward() != null && req.xpReward() > 0
                ? req.xpReward()
                : switch (timeType) {
                    case "WEEKLY"  -> 150;
                    case "MONTHLY" -> 300;
                    default        -> 50;
                };

        // Generate unique key from label
        String baseKey = "CUSTOM_" + req.label().replaceAll("[^a-zA-Z0-9]", "_").toUpperCase();
        if (baseKey.length() > 44) baseKey = baseKey.substring(0, 44);
        String key = baseKey;
        int suffix = 1;
        while (questRepository.existsByQuestKey(key)) {
            key = baseKey + "_" + suffix++;
        }

        Quest q = new Quest(key, req.label().trim(), category, xp, req.statBoosts(), null);
        q.setTimeType(timeType);
        q.setCustom(true);
        q.setOwnerId(playerId);
        q.setPriority(3);

        q = questRepository.save(q);
        return toDto(q, false);
    }

    /**
     * Deletes a custom quest — only if it's owned by this player.
     * Cascades: removes all past completions of this quest by this player.
     */
    @Transactional
    public void deleteCustomQuest(Long playerId, String questKey) {
        Quest quest = questRepository.findByQuestKey(questKey)
                .orElseThrow(() -> new ApiException("Quest not found", HttpStatus.NOT_FOUND));

        if (!quest.isCustom() || !playerId.equals(quest.getOwnerId())) {
            throw new ApiException("Cannot delete a system quest", HttpStatus.FORBIDDEN);
        }

        // Cascade: remove all completions for this quest by this player
        completionRepository.deleteByPlayerIdAndQuestId(playerId, quest.getId());
        questRepository.delete(quest);
    }

    // ── DTO Mapping ────────────────────────────────────────────────────────────

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

        String timeType = q.getTimeType() != null ? q.getTimeType() : "DAILY";

        return new QuestDTO(q.getId(), q.getQuestKey(), label, q.getCategory().name(),
                xpReward, q.getStatBoosts(), q.getSkillBoosts(), completed,
                q.getPriority(), q.isCritical(), q.getBossDamage(), q.isRecoveryQuest(),
                timeType, q.isCustom(), 0, 0);
    }

    // ── Private Helpers ────────────────────────────────────────────────────────

    private Set<Long> getCompletedQuestIds(Long playerId, LocalDate date) {
        return completionRepository.findByPlayerIdAndCompletedAt(playerId, date).stream()
                .map(QuestCompletion::getQuestId)
                .collect(Collectors.toSet());
    }

    private QuestCompletionResult completePenaltyQuest(Player player) {
        if (!player.isInPenaltyZone()) {
            throw new ApiException("Not in penalty zone", HttpStatus.BAD_REQUEST);
        }
        player.setInPenaltyZone(false);
        playerRepository.save(player);
        sseService.send(player.getId(), "player-update", Map.of("inPenaltyZone", false));

        PlayerStats stats = statsRepository.findByPlayerId(player.getId())
                .orElseThrow(() -> new ApiException("Stats not found", HttpStatus.NOT_FOUND));
        StatsDTO statsDto = new StatsDTO(stats.getStrength(), stats.getIntelligence(),
                stats.getVitality(), stats.getAgility(), stats.getPerception(), stats.getDis());

        return new QuestCompletionResult("PENALTY_SURVIVAL", "Penalty Survival", 0,
                false, player.getLevel(), player.getRankLevel(), false, statsDto, List.of(), List.of());
    }

    private List<String> applyStatBoosts(PlayerStats stats, Map<String, Integer> boosts) {
        List<String> gained = new ArrayList<>();
        if (boosts == null) return gained;
        boosts.forEach((key, val) -> {
            switch (key.toUpperCase()) {
                case "STR" -> stats.setStrength(stats.getStrength() + val);
                case "INT" -> stats.setIntelligence(stats.getIntelligence() + val);
                case "VIT" -> stats.setVitality(stats.getVitality() + val);
                case "AGI" -> stats.setAgility(stats.getAgility() + val);
                case "PER" -> stats.setPerception(stats.getPerception() + val);
                case "DIS" -> stats.setDis(stats.getDis() + val);
                default -> { return; }
            }
            gained.add(key.toUpperCase() + " +" + val);
        });
        return gained;
    }

    private void applySkillBoosts(Long playerId, Map<String, Integer> boosts) {
        if (boosts == null) return;
        boosts.forEach((skillName, val) -> {
            PlayerSkill skill = skillRepository
                    .findByPlayerIdAndSkillName(playerId, skillName)
                    .orElseGet(() -> new PlayerSkill(playerId, skillName, 0));
            int newPct = Math.min(100, skill.getSkillPct() + val);
            skill.setSkillPct(newPct);
            skill.setSkillXp(skill.getSkillXp() + (val * 10));
            skill.recalculateLevelAndRank();
            skill.setUpdatedAt(java.time.LocalDateTime.now());
            skillRepository.save(skill);
        });
    }



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

