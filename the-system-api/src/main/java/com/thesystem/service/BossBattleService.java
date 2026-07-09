package com.thesystem.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.thesystem.dto.BossBattleDTO;
import com.thesystem.dto.EvaluationDTO;
import com.thesystem.entity.BossBattle;
import com.thesystem.entity.Player;
import com.thesystem.exception.ApiException;
import com.thesystem.repository.BossBattleRepository;
import com.thesystem.repository.PlayerRepository;
import com.thesystem.service.AiProviderService.Scenario;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Boss Battle Mode — AI-generated technical interview gauntlet.
 * 5 questions per battle, scored 0-10 each, XP awarded on completion.
 *
 * XP tiers (based on average score):
 *   8-10 → +300 XP (S-rank performance)
 *   5-7  → +150 XP (satisfactory)
 *   < 5  → +50  XP (attempted, keep trying)
 */
@Service
public class BossBattleService {

    private static final Logger log = LoggerFactory.getLogger(BossBattleService.class);

    private final AiProviderService ai;
    private final BossBattleRepository battleRepo;
    private final PlayerRepository playerRepo;
    private final ObjectMapper mapper = new ObjectMapper();

    private static final String GEN_PROMPT =
        "You are a Senior Java technical interviewer. Generate exactly 5 %s-level technical " +
        "interview questions about \"%s\" for a Java developer with 2 years of experience. " +
        "Include Spring Boot and microservices context where relevant. " +
        "Return ONLY a valid JSON array, no markdown, no extra text:\n" +
        "[{\"question\":\"...\",\"hint\":\"...\",\"expectedKeyPoints\":[\"p1\",\"p2\",\"p3\"]}]";

    private static final String EVAL_PROMPT =
        "You are a Senior Java technical interviewer evaluating an answer. " +
        "Question: \"%s\"\nCandidate answered: \"%s\"\n" +
        "Score this answer 0-10. Be specific about what was good and what was missing. " +
        "Return ONLY valid JSON, no markdown:\n" +
        "{\"score\":N,\"feedback\":\"...\",\"missedPoints\":[\"...\"],\"strongPoints\":[\"...\"]}";

    public BossBattleService(AiProviderService ai, BossBattleRepository battleRepo,
                             PlayerRepository playerRepo) {
        this.ai = ai;
        this.battleRepo = battleRepo;
        this.playerRepo = playerRepo;
    }

    // ── Start battle ──────────────────────────────────────────────────────────

    public BossBattleDTO startBattle(Long playerId, String topic, String difficulty) {
        String diffLabel = switch (difficulty.toUpperCase()) {
            case "EASY"  -> "E-Rank (beginner)";
            case "HARD"  -> "A-Rank (advanced)";
            default      -> "C-Rank (intermediate)";
        };
        String prompt = String.format(GEN_PROMPT, diffLabel, topic);
        String raw = ai.generate(Scenario.BOSS_BATTLE, "You generate JSON only. No markdown.", prompt);
        String questionsJson = extractJson(raw, "[");

        BossBattle battle = new BossBattle();
        battle.setPlayerId(playerId);
        battle.setTopic(topic);
        battle.setDifficulty(difficulty.toUpperCase());
        battle.setQuestions(questionsJson);
        battle = battleRepo.save(battle);

        return toDto(battle, parseQuestions(questionsJson));
    }

    // ── Answer a question ─────────────────────────────────────────────────────

    public EvaluationDTO answerQuestion(Long playerId, Long battleId, int questionIndex, String answer) {
        BossBattle battle = owned(playerId, battleId);

        List<Map<String, Object>> questions = parseQuestions(battle.getQuestions());
        if (questionIndex < 0 || questionIndex >= questions.size()) {
            throw new ApiException("Invalid question index", HttpStatus.BAD_REQUEST);
        }
        String question = String.valueOf(questions.get(questionIndex).get("question"));
        String prompt = String.format(EVAL_PROMPT, question, answer);
        String raw = ai.generate(Scenario.EVALUATION, "You generate JSON only. No markdown.", prompt);
        String evalJson = extractJson(raw, "{");

        // Persist answer + evaluation
        persistAnswer(battle, questionIndex, answer, evalJson);

        return parseEvaluation(evalJson, questionIndex, question);
    }

    // ── Complete battle ───────────────────────────────────────────────────────

    public BossBattleDTO completeBattle(Long playerId, Long battleId) {
        BossBattle battle = owned(playerId, battleId);
        if (battle.getCompletedAt() != null) return toDto(battle, parseQuestions(battle.getQuestions()));

        int totalScore = calcTotalScore(battle.getEvaluations());
        int xp = totalScore >= 40 ? 300 : totalScore >= 25 ? 150 : 50;

        battle.setScore(totalScore);
        battle.setXpEarned(xp);
        battle.setCompletedAt(LocalDateTime.now());
        battle = battleRepo.save(battle);

        // Award XP to player
        Player player = playerRepo.findById(playerId).orElse(null);
        if (player != null) {
            player.setCurrentXp(player.getCurrentXp() + xp);
            player.setTotalXp(player.getTotalXp() + xp);
            playerRepo.save(player);
        }
        return toDto(battle, parseQuestions(battle.getQuestions()));
    }

    public BossBattleDTO getBattle(Long playerId, Long battleId) {
        return toDto(owned(playerId, battleId), parseQuestions(owned(playerId, battleId).getQuestions()));
    }

    public List<BossBattleDTO> history(Long playerId) {
        return battleRepo.findByPlayerIdOrderByStartedAtDesc(playerId)
                .stream().map(b -> toDto(b, parseQuestions(b.getQuestions()))).toList();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private BossBattle owned(Long playerId, Long battleId) {
        BossBattle b = battleRepo.findById(battleId)
                .orElseThrow(() -> new ApiException("Battle not found", HttpStatus.NOT_FOUND));
        if (!b.getPlayerId().equals(playerId))
            throw new ApiException("Not your battle", HttpStatus.FORBIDDEN);
        return b;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> parseQuestions(String json) {
        if (json == null || json.isBlank()) return List.of();
        try { return mapper.readValue(json, new TypeReference<>() {}); }
        catch (Exception e) { return List.of(); }
    }

    @SuppressWarnings("unchecked")
    private EvaluationDTO parseEvaluation(String json, int idx, String question) {
        try {
            Map<String, Object> m = mapper.readValue(json, new TypeReference<>() {});
            int score = ((Number) m.getOrDefault("score", 0)).intValue();
            String feedback = String.valueOf(m.getOrDefault("feedback", ""));
            List<String> missed = (List<String>) m.getOrDefault("missedPoints", List.of());
            List<String> strong = (List<String>) m.getOrDefault("strongPoints", List.of());
            return new EvaluationDTO(idx, question, score, feedback, missed, strong);
        } catch (Exception e) {
            return new EvaluationDTO(idx, question, 0, "Evaluation parsing error", List.of(), List.of());
        }
    }

    private void persistAnswer(BossBattle battle, int idx, String answer, String evalJson) {
        try {
            // answers: JSON array indexed by question
            List<String> answers = parseStringList(battle.getAnswers(), 5);
            List<String> evals = parseStringList(battle.getEvaluations(), 5);
            while (answers.size() <= idx) answers.add(null);
            while (evals.size()   <= idx) evals.add(null);
            answers.set(idx, answer);
            evals.set(idx, evalJson);
            battle.setAnswers(mapper.writeValueAsString(answers));
            battle.setEvaluations(mapper.writeValueAsString(evals));
            battleRepo.save(battle);
        } catch (Exception e) {
            log.error("Failed to persist answer for battle {}", battle.getId(), e);
        }
    }

    @SuppressWarnings("unchecked")
    private List<String> parseStringList(String json, int defaultSize) {
        if (json == null || json.isBlank()) {
            return new java.util.ArrayList<>(java.util.Collections.nCopies(defaultSize, null));
        }
        try { return new java.util.ArrayList<>(mapper.readValue(json, new TypeReference<List<String>>() {})); }
        catch (Exception e) { return new java.util.ArrayList<>(java.util.Collections.nCopies(defaultSize, null)); }
    }

    @SuppressWarnings("unchecked")
    private int calcTotalScore(String evalsJson) {
        if (evalsJson == null || evalsJson.isBlank()) return 0;
        try {
            List<String> evals = mapper.readValue(evalsJson, new TypeReference<>() {});
            int total = 0;
            for (String e : evals) {
                if (e != null) {
                    Map<String, Object> m = mapper.readValue(e, new TypeReference<>() {});
                    total += ((Number) m.getOrDefault("score", 0)).intValue();
                }
            }
            return total;
        } catch (Exception e) { return 0; }
    }

    private String extractJson(String raw, String startChar) {
        if (raw == null) return startChar.equals("[") ? "[]" : "{}";
        int start = raw.indexOf(startChar);
        if (start < 0) return startChar.equals("[") ? "[]" : "{}";
        String end = startChar.equals("[") ? "]" : "}";
        int finish = raw.lastIndexOf(end);
        if (finish < 0) return raw;
        return raw.substring(start, finish + 1);
    }

    private BossBattleDTO toDto(BossBattle b, List<Map<String, Object>> questions) {
        return new BossBattleDTO(b.getId(), b.getPlayerId(), b.getTopic(), b.getDifficulty(),
                questions, b.getScore(), b.getXpEarned(), b.getStartedAt(), b.getCompletedAt());
    }
}


