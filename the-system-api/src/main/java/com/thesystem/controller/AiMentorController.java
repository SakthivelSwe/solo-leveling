package com.thesystem.controller;

import com.thesystem.dto.MonthlyReportDTO;
import com.thesystem.dto.StatusWindowDTO;
import com.thesystem.security.CurrentPlayer;
import com.thesystem.service.AiMentorService;
import com.thesystem.service.PlayerService;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
public class AiMentorController {

    private final AiMentorService mentor;
    private final PlayerService playerService;
    private final CurrentPlayer currentPlayer;

    public AiMentorController(AiMentorService mentor, PlayerService playerService,
                               CurrentPlayer currentPlayer) {
        this.mentor = mentor;
        this.playerService = playerService;
        this.currentPlayer = currentPlayer;
    }

    /** Daily coaching message — called on dashboard load. */
    @GetMapping("/coaching")
    public Map<String, String> coaching(Principal p) {
        StatusWindowDTO status = playerService.getStatusWindow(currentPlayer.id(p));
        return Map.of("message", mentor.getDailyCoaching(status));
    }

    /** Quest / habit suggestion based on weakest stat. */
    @GetMapping("/suggestion")
    public Map<String, Object> suggestion(Principal p) {
        StatusWindowDTO status = playerService.getStatusWindow(currentPlayer.id(p));
        String raw = mentor.getQuestSuggestion(status);
        // Return as raw JSON string — frontend parses it
        return Map.of("raw", raw);
    }

    /** AI Mentor chat. */
    @PostMapping("/mentor")
    public Map<String, String> chat(Principal p, @RequestBody Map<String, String> body) {
        StatusWindowDTO status = playerService.getStatusWindow(currentPlayer.id(p));
        String message = body.getOrDefault("message", "");
        String context = body.getOrDefault("context", "general");
        return Map.of("reply", mentor.chat(status, message, context));
    }

    /** THE SYSTEM's monthly review — one win, one weakness, two commands. */
    @GetMapping("/weekly-review")
    public Map<String, String> weeklyReview(Principal p) {
        Long id = currentPlayer.id(p);
        StatusWindowDTO status = playerService.getStatusWindow(id);
        MonthlyReportDTO report = playerService.getMonthlyReport(id);
        return Map.of("review", mentor.weeklyReview(status, report));
    }
}

