package com.thesystem.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Dual-AI provider: Groq (primary for speed/chat) + Gemini (primary for structured JSON).
 *
 * Scenario routing:
 *   CHAT / COACHING → Groq first (llama-3.3-70b is extremely fast), fallback Gemini
 *   BOSS_BATTLE / EVAL → Gemini first (better structured JSON), fallback Groq
 *
 * Auto-fallback: if the primary throws any exception, the secondary is tried automatically.
 */
@Service
public class AiProviderService {

    private static final Logger log = LoggerFactory.getLogger(AiProviderService.class);

    @Value("${thesystem.ai.groq-api-key}")
    private String groqKey;

    @Value("${thesystem.ai.gemini-api-key}")
    private String geminiKey;

    @Value("${thesystem.ai.groq-model:llama-3.3-70b-versatile}")
    private String groqModel;

    @Value("${thesystem.ai.gemini-model:gemini-2.0-flash}")
    private String geminiModel;

    private final RestClient http = RestClient.create();

    public enum Scenario { CHAT, COACHING, BOSS_BATTLE, EVALUATION, SUGGESTION, NOTEBOOK }

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Routes to the best provider for the scenario, with automatic fallback.
     */
    public String generate(Scenario scenario, String systemPrompt, String userPrompt) {
        boolean geminiFirst = scenario == Scenario.BOSS_BATTLE || scenario == Scenario.EVALUATION
                || scenario == Scenario.NOTEBOOK;
        if (geminiFirst) {
            try { return callGemini(systemPrompt, userPrompt); }
            catch (Exception e) {
                log.warn("Gemini failed for {}, falling back to Groq: {}", scenario, e.getMessage());
                return callGroq(systemPrompt, userPrompt);
            }
        } else {
            try { return callGroq(systemPrompt, userPrompt); }
            catch (Exception e) {
                log.warn("Groq failed for {}, falling back to Gemini: {}", scenario, e.getMessage());
                return callGemini(systemPrompt, userPrompt);
            }
        }
    }

    // ── Groq (OpenAI-compatible endpoint) ────────────────────────────────────

    @SuppressWarnings("unchecked")
    private String callGroq(String systemPrompt, String userPrompt) {
        var body = Map.of(
            "model", groqModel,
            "messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user",   "content", userPrompt)
            ),
            "temperature", 0.7,
            "max_tokens", 1024
        );
        Map<?, ?> resp = http.post()
            .uri("https://api.groq.com/openai/v1/chat/completions")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + groqKey)
            .contentType(MediaType.APPLICATION_JSON)
            .body(body)
            .retrieve()
            .body(Map.class);

        return extractGroqText(resp);
    }

    @SuppressWarnings("unchecked")
    private String extractGroqText(Map<?, ?> resp) {
        var choices = (List<?>) resp.get("choices");
        if (choices == null || choices.isEmpty()) throw new RuntimeException("No choices from Groq");
        var msg = (Map<?, ?>) ((Map<?, ?>) choices.get(0)).get("message");
        return String.valueOf(msg.get("content")).trim();
    }

    // ── Gemini ────────────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private String callGemini(String systemPrompt, String userPrompt) {
        String combined = systemPrompt + "\n\n" + userPrompt;
        var body = Map.of(
            "contents", List.of(
                Map.of("parts", List.of(Map.of("text", combined)))
            ),
            "tools", List.of(
                Map.of("googleSearch", Map.of())
            ),
            "generationConfig", Map.of(
                "temperature", 0.7,
                "maxOutputTokens", 1024
            )
        );
        String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                + geminiModel + ":generateContent?key=" + geminiKey;

        Map<?, ?> resp = http.post()
            .uri(url)
            .contentType(MediaType.APPLICATION_JSON)
            .body(body)
            .retrieve()
            .body(Map.class);

        return extractGeminiText(resp);
    }

    @SuppressWarnings("unchecked")
    private String extractGeminiText(Map<?, ?> resp) {
        var candidates = (List<?>) resp.get("candidates");
        if (candidates == null || candidates.isEmpty()) throw new RuntimeException("No candidates from Gemini");
        var content = (Map<?, ?>) ((Map<?, ?>) candidates.get(0)).get("content");
        var parts = (List<?>) content.get("parts");
        if (parts == null || parts.isEmpty()) throw new RuntimeException("Empty parts from Gemini");
        return String.valueOf(((Map<?, ?>) parts.get(0)).get("text")).trim();
    }
}

