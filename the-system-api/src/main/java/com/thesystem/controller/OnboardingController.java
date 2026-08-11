package com.thesystem.controller;

import com.thesystem.security.JwtService;
import com.thesystem.service.OnboardingService;
import com.thesystem.service.OnboardingService.OnboardingResult;
import com.thesystem.service.PlayerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Handles the new-user onboarding assessment flow.
 *
 * POST /api/onboarding/submit — submit questionnaire answers, get starting profile
 * GET  /api/onboarding/status — check if current player has completed onboarding
 */
@RestController
@RequestMapping("/api/onboarding")
public class OnboardingController {

    private final OnboardingService onboardingService;
    private final PlayerService playerService;
    private final JwtService jwtService;

    public OnboardingController(OnboardingService onboardingService,
                                PlayerService playerService,
                                JwtService jwtService) {
        this.onboardingService = onboardingService;
        this.playerService = playerService;
        this.jwtService = jwtService;
    }

    /**
     * Submit onboarding assessment answers.
     * Body: Map<String, String> of question keys to answer values.
     * Returns: OnboardingResult with domain labels and recommended daily quest count.
     */
    @PostMapping("/submit")
    public ResponseEntity<OnboardingResult> submit(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> answers) {

        Long playerId = resolvePlayerId(authHeader);
        OnboardingResult result = onboardingService.submitAssessment(playerId, answers);
        return ResponseEntity.ok(result);
    }

    /**
     * Check whether the current player has completed onboarding.
     * Used by the Angular guard to decide whether to show the onboarding screen.
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status(
            @RequestHeader("Authorization") String authHeader) {

        Long playerId = resolvePlayerId(authHeader);
        var player = playerService.getProfile(playerId);
        return ResponseEntity.ok(Map.of(
                "onboardingComplete", player.onboardingComplete(),
                "level", player.level()
        ));
    }

    private Long resolvePlayerId(String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String username = jwtService.extractUsername(token);
        return playerService.findByUsername(username).getId();
    }
}
