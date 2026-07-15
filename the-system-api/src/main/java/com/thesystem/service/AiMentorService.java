package com.thesystem.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.thesystem.dto.MonthlyReportDTO;
import com.thesystem.dto.StatusWindowDTO;
import com.thesystem.service.AiProviderService.Scenario;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * THE SYSTEM's AI Mentor.
 * Generates coaching messages, quest suggestions, and answers chat questions
 * from THE SYSTEM's cold, powerful perspective — like the System from Solo Leveling.
 */
@Service
public class AiMentorService {

    private final AiProviderService ai;
    private final AiMemoryService memoryService;
    private final ObjectMapper mapper = new ObjectMapper();

    private static final String SYSTEM_IDENTITY =
        "You are 'THE SYSTEM' — an all-knowing, cold, powerful AI from the manhwa Solo Leveling. " +
        "You speak directly, without small talk, without sympathy. You push the hunter. " +
        "You reference their exact stats. You name their weakness. You give no solutions, " +
        "only commands and hard truth. The hunter's name is Sakthivel, a 26-year-old Java developer " +
        "in Chennai grinding to become S-Rank. Never apologize. Never motivate softly. " +
        "Speak like a system prompt, not a life coach. Max 60 words unless asked for more.";

    public AiMentorService(AiProviderService ai, AiMemoryService memoryService) {
        this.ai = ai;
        this.memoryService = memoryService;
    }

    /** Daily coaching message based on today's status. Used on dashboard load. */
    public String getDailyCoaching(StatusWindowDTO status) {
        String memory = status != null && status.player() != null
                ? memoryService.buildMemoryContext(status.player().id()) : "";
        String prompt = buildStatusContext(status) + memory +
            "\nGenerate a 2-sentence daily directive in THE SYSTEM's cold tone. " +
            "Reference the hunter's weakest stat (" + weakestStat(status) + "). " +
            "Do not give specific coding tasks. Give only the directive. Max 50 words.";
        return ai.generate(Scenario.COACHING, SYSTEM_IDENTITY, prompt);
    }

    /** Suggest one specific real-world task for the hunter's weakest area. */
    public String getQuestSuggestion(StatusWindowDTO status) {
        String weakest = weakestStat(status);
        String prompt = buildStatusContext(status) +
            "\nSuggest ONE specific real-world task to improve " + weakest + " stat. " +
            "Return JSON only, no markdown: {\"task\":\"...\",\"steps\":[\"1.\",\"2.\",\"3.\"],\"xpEstimate\":N}. " +
            "Be specific to a Java developer in Chennai. No extra text.";
        return ai.generate(Scenario.SUGGESTION, SYSTEM_IDENTITY, prompt);
    }

    /** AI Mentor free chat. Context-aware based on the provided context type. */
    public String chat(StatusWindowDTO status, String message, String context) {
        String ctxPrompt = switch (context) {
            case "boss_battle" -> "The hunter is preparing for a technical Boss Battle interview. They need tactical advice.";
            case "system_status" -> "The hunter is reviewing their status window. They need a push.";
            default -> "General hunter query.";
        };
        String prompt = buildStatusContext(status) +
            "\nContext: " + ctxPrompt +
            "\nHunter says: \"" + message + "\"" +
            "\nRespond as THE SYSTEM. Be direct, powerful, cold. Max 80 words.";
        return ai.generate(Scenario.CHAT, SYSTEM_IDENTITY, prompt);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    /** THE SYSTEM's verdict on the month — one win, one weakness, two commands. */
    public String weeklyReview(StatusWindowDTO status, MonthlyReportDTO report) {
        String memory = status != null && status.player() != null
                ? memoryService.buildMemoryContext(status.player().id()) : "";
        String data = report == null ? "" : String.format(
            "%nMonth data: %s | active %d/%d days | perfect days %d | current streak %d | " +
            "longest streak %d | quests %d | XP %d | strongest %s | weakest %s | %s-Rank LV.%d",
            report.monthLabel(), report.daysActive(), report.daysElapsed(), report.perfectDays(),
            report.currentStreak(), report.longestStreak(), report.totalQuestsMonth(),
            report.totalXpMonth(), report.bestStat(), report.weakestStat(),
            report.rankLevel(), report.level());

        String prompt = buildStatusContext(status) + data + memory +
            "\nWrite THE SYSTEM's monthly review of this hunter. Acknowledge ONE win, expose ONE " +
            "weakness (referencing specific quest skips from memory if available), then issue exactly " +
            "TWO concrete commands for next week. Cold, powerful, no sympathy. 4-6 sentences, max 130 words.";
        return ai.generate(Scenario.COACHING, SYSTEM_IDENTITY, prompt);
    }


    private String buildStatusContext(StatusWindowDTO status) {
        if (status == null) return "";
        var p = status.player();
        var s = status.stats();
        if (p == null || s == null) return "";
        return String.format(
            "Hunter: %s | Rank: %s-Rank | Level: %d | HP: %d/%d | " +
            "Stats: STR=%d INT=%d VIT=%d AGI=%d PER=%d HOR=%d | " +
            "Today: %d/%d quests cleared | Streak: %d days",
            p.displayName() != null ? p.displayName() : p.username(),
            p.rankLevel(), p.level(), p.hp(), p.maxHp(),
            s.str(), s.intelligence(), s.vit(), s.agi(), s.per(), s.hor(),
            status.completedToday(), status.totalQuests(), status.streak()
        );
    }

    private String weakestStat(StatusWindowDTO status) {
        if (status == null || status.stats() == null) return "VIT";
        var s = status.stats();
        int min = Math.min(Math.min(Math.min(s.str(), s.intelligence()), Math.min(s.vit(), s.agi())),
                           Math.min(s.per(), s.hor()));
        if (s.str() == min) return "STR";
        if (s.intelligence() == min) return "INT";
        if (s.vit() == min) return "VIT";
        if (s.agi() == min) return "AGI";
        if (s.per() == min) return "PER";
        return "HOR";
    }
}

