package com.thesystem.dto;

import java.util.List;

/**
 * Response from the Gemini Smart Notebook analysis of a YouTube URL.
 * Returned by POST /api/learning/analyze-url and used to pre-fill the learning log form.
 */
public record SmartNotebookDTO(
    String videoTitle,
    String subject,          // "Java", "Spring Boot", "DSA", etc.
    String topic,            // specific topic name
    int estimatedMinutes,
    String summary,          // 3-4 sentence plain-English summary
    List<String> keyPoints,  // 5-8 concepts IN ORDER as taught
    List<String> recallQuestions,  // 5 questions to self-test
    String skillTag          // maps to PlayerSkill name: "Java + Spring Boot", "DSA / LeetCode", etc.
) {}
