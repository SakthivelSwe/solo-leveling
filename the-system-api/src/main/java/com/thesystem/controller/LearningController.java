package com.thesystem.controller;

import com.thesystem.dto.LearningStatsDTO;
import com.thesystem.dto.SmartNotebookDTO;
import com.thesystem.entity.LearningLog;
import com.thesystem.security.CurrentPlayer;
import com.thesystem.service.LearningService;
import com.thesystem.service.SmartNotebookService;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

/**
 * REST controller for the Learning Activity Tracker.
 *
 * Endpoints:
 *   POST   /api/learning/log            — log a learning session
 *   GET    /api/learning/history        — recent 30 sessions
 *   GET    /api/learning/due-recalls    — sessions with recall overdue today
 *   POST   /api/learning/{id}/recall    — mark recall done + SM-2 update
 *   GET    /api/learning/stats          — aggregated learning stats
 *   POST   /api/learning/analyze-url    — Gemini Smart Notebook: analyze YouTube URL
 */
@RestController
@RequestMapping("/api/learning")
public class LearningController {

    private final LearningService learningService;
    private final SmartNotebookService smartNotebookService;
    private final CurrentPlayer currentPlayer;

    public LearningController(LearningService learningService,
                              SmartNotebookService smartNotebookService,
                              CurrentPlayer currentPlayer) {
        this.learningService = learningService;
        this.smartNotebookService = smartNotebookService;
        this.currentPlayer = currentPlayer;
    }

    /** Log a new learning session. Returns the saved log with computed XP. */
    @PostMapping("/log")
    public LearningLog logSession(Principal p, @RequestBody LearningLog body) {
        return learningService.logSession(currentPlayer.id(p), body);
    }

    /** Recent 30 learning sessions. */
    @GetMapping("/history")
    public List<LearningLog> history(Principal p) {
        return learningService.getHistory(currentPlayer.id(p));
    }

    /** All sessions where recall is due today or overdue. */
    @GetMapping("/due-recalls")
    public List<LearningLog> dueRecalls(Principal p) {
        return learningService.getDueRecalls(currentPlayer.id(p));
    }

    /**
     * Mark recall done for a session.
     * Body: { "confidenceScore": 4, "keyPointResults": [true, true, false, true] }
     */
    @PostMapping("/{id}/recall")
    public LearningLog markRecall(Principal p,
                                  @PathVariable Long id,
                                  @RequestBody Map<String, Object> body) {
        int confidence = body.containsKey("confidenceScore")
                ? ((Number) body.get("confidenceScore")).intValue() : 3;

        @SuppressWarnings("unchecked")
        List<Boolean> keyPoints = body.containsKey("keyPointResults")
                ? (List<Boolean>) body.get("keyPointResults") : List.of();

        return learningService.markRecallDone(currentPlayer.id(p), id, confidence, keyPoints);
    }

    /** Aggregated learning stats for the dashboard. */
    @GetMapping("/stats")
    public LearningStatsDTO stats(Principal p) {
        return learningService.getStats(currentPlayer.id(p));
    }

    /**
     * Smart Notebook: analyze a YouTube URL using Gemini AI.
     * Returns structured notebook data to pre-fill the learning log form.
     * Body: { "url": "https://youtube.com/watch?v=..." }
     */
    @PostMapping("/analyze-url")
    public SmartNotebookDTO analyzeUrl(Principal p, @RequestBody Map<String, String> body) {
        // Authentication check (ensure player is logged in)
        currentPlayer.id(p);
        String url = body.get("url");
        if (url == null || url.isBlank()) {
            throw new com.thesystem.exception.ApiException("URL is required",
                    org.springframework.http.HttpStatus.BAD_REQUEST);
        }
        return smartNotebookService.analyzeYoutubeUrl(url);
    }
}
