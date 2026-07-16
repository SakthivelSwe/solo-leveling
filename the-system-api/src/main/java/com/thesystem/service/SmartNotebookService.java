package com.thesystem.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.thesystem.dto.SmartNotebookDTO;
import com.thesystem.service.AiProviderService.Scenario;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Uses Gemini AI to analyze a YouTube video URL and extract structured learning content:
 * - Video title and subject classification
 * - Key concepts in the ORDER they are taught (Feynman-ready)
 * - 5 recall questions for spaced repetition
 * - Summary for quick review
 *
 * Gemini 1.5/2.0 Flash supports YouTube URLs as direct multimodal input —
 * no YouTube API key or transcript fetching required.
 */
@Service
public class SmartNotebookService {

    private static final Logger log = LoggerFactory.getLogger(SmartNotebookService.class);

    private final AiProviderService ai;
    private final ObjectMapper mapper = new ObjectMapper();

    private static final String NOTEBOOK_SYSTEM_PROMPT =
        "You are a precise learning assistant that extracts structured knowledge from educational videos. " +
        "You always respond with STRICT JSON only — no markdown, no code blocks, no explanation. " +
        "If the URL is not a valid educational video, still return the JSON with best-effort values. " +
        "Focus on Java, Spring Boot, DSA, System Design, Angular, and software engineering topics.";

    public SmartNotebookService(AiProviderService ai) {
        this.ai = ai;
    }

    /**
     * Analyzes a YouTube URL using Gemini and returns structured notebook data.
     * Falls back to a generic response if Gemini analysis fails.
     *
     * @param youtubeUrl The YouTube video URL to analyze
     * @return Structured SmartNotebookDTO with video summary and recall content
     */
    public SmartNotebookDTO analyzeYoutubeUrl(String youtubeUrl) {
        String prompt = buildNotebookPrompt(youtubeUrl);
        try {
            String raw = ai.generate(Scenario.NOTEBOOK, NOTEBOOK_SYSTEM_PROMPT, prompt);
            return parseNotebookResponse(raw);
        } catch (Exception e) {
            log.warn("Smart Notebook Gemini analysis failed for URL {}: {}", youtubeUrl, e.getMessage());
            return fallbackNotebook(youtubeUrl);
        }
    }

    private String buildNotebookPrompt(String url) {
        return "Analyze this YouTube educational video: " + url + "\n\n" +
            "Extract and return STRICT JSON only (no markdown fences, no extra text):\n" +
            "{\n" +
            "  \"videoTitle\": \"exact video title\",\n" +
            "  \"subject\": \"one of: Java | Spring Boot | DSA | System Design | Angular | JavaScript | DevOps | Other\",\n" +
            "  \"topic\": \"specific topic name (e.g. OOP — Inheritance and Polymorphism)\",\n" +
            "  \"estimatedMinutes\": 60,\n" +
            "  \"summary\": \"3-4 sentence plain-English summary of exactly what is taught\",\n" +
            "  \"keyPoints\": [\n" +
            "    \"1. First concept taught — one sentence\",\n" +
            "    \"2. Second concept taught — one sentence\",\n" +
            "    \"3. ...\"\n" +
            "  ],\n" +
            "  \"recallQuestions\": [\n" +
            "    \"What is X and why does it matter?\",\n" +
            "    \"How does Y differ from Z?\",\n" +
            "    \"...\"\n" +
            "  ],\n" +
            "  \"skillTag\": \"one of: Java + Spring Boot | DSA / LeetCode | Angular / JavaScript | System Design | English Speaking | Other\"\n" +
            "}\n\n" +
            "Rules:\n" +
            "- keyPoints MUST be in the ORDER topics are taught in the video (5-8 points)\n" +
            "- recallQuestions MUST test core concepts (exactly 5 questions)\n" +
            "- All strings in English\n" +
            "- estimatedMinutes is the actual video length";
    }

    @SuppressWarnings("unchecked")
    private SmartNotebookDTO parseNotebookResponse(String raw) throws Exception {
        // Strip any accidental markdown fences
        String cleaned = raw.trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceAll("```[a-z]*\\n?", "").replaceAll("```", "").trim();
        }

        var map = mapper.readValue(cleaned, new TypeReference<java.util.Map<String, Object>>() {});

        String videoTitle = str(map, "videoTitle", "Unknown Video");
        String subject = str(map, "subject", "Other");
        String topic = str(map, "topic", "General Learning");
        int estimatedMinutes = intVal(map, "estimatedMinutes", 30);
        String summary = str(map, "summary", "");
        List<String> keyPoints = listOf(map, "keyPoints");
        List<String> recallQuestions = listOf(map, "recallQuestions");
        String skillTag = str(map, "skillTag", "Other");

        return new SmartNotebookDTO(videoTitle, subject, topic, estimatedMinutes,
                summary, keyPoints, recallQuestions, skillTag);
    }

    @SuppressWarnings("unchecked")
    private List<String> listOf(java.util.Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof List) return (List<String>) val;
        return List.of();
    }

    private String str(java.util.Map<String, Object> map, String key, String fallback) {
        Object val = map.get(key);
        return val != null ? String.valueOf(val) : fallback;
    }

    private int intVal(java.util.Map<String, Object> map, String key, int fallback) {
        Object val = map.get(key);
        if (val instanceof Number) return ((Number) val).intValue();
        return fallback;
    }

    private SmartNotebookDTO fallbackNotebook(String url) {
        return new SmartNotebookDTO(
            "Video Analysis Unavailable",
            "Other",
            "Please fill topic manually",
            30,
            "Could not analyze the video automatically. Please add your notes manually.",
            List.of("1. Fill in your key learnings manually"),
            List.of("What did you learn from this video?"),
            "Other"
        );
    }
}
