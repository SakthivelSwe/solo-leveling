package com.thesystem.controller;

import com.thesystem.entity.LearningLog;
import com.thesystem.entity.Player;
import com.thesystem.exception.ApiException;
import com.thesystem.repository.PlayerRepository;
import com.thesystem.service.LearningService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Receives webhook events from the DevMastery platform when a user completes a topic.
 *
 * Authentication: shared secret via X-Webhook-Secret header.
 * Player mapping: by email (Option B — both systems share the same email).
 *
 * Endpoints:
 *   POST /api/devmastery/webhook  — real-time topic completion from DevMastery
 *   POST /api/devmastery/sync     — manual sync: pull latest progress from DevMastery API
 */
@RestController
@RequestMapping("/api/devmastery")
public class DevMasteryWebhookController {

    private static final Logger log = LoggerFactory.getLogger(DevMasteryWebhookController.class);

    @Value("${thesystem.devmastery.webhook-secret:}")
    private String webhookSecret;

    @Value("${thesystem.devmastery.api-url:https://devmastery-core.onrender.com}")
    private String devMasteryApiUrl;

    private final PlayerRepository playerRepo;
    private final LearningService learningService;

    public DevMasteryWebhookController(PlayerRepository playerRepo,
                                       LearningService learningService) {
        this.playerRepo = playerRepo;
        this.learningService = learningService;
    }

    /**
     * Webhook endpoint called by DevMastery when a user completes a topic.
     *
     * Expected payload:
     * {
     *   "email": "sakthivel@example.com",
     *   "topicId": "java-oop-inheritance-uuid",
     *   "topicTitle": "OOP — Inheritance",
     *   "pathSlug": "java-backend",
     *   "xpEarned": 50,
     *   "timestamp": "2026-07-16T18:00:00Z"
     * }
     */
    @PostMapping("/webhook")
    public Map<String, Object> handleWebhook(
            @RequestHeader(value = "X-Webhook-Secret", required = false) String secret,
            @RequestBody Map<String, Object> payload) {

        // Validate shared secret
        validateSecret(secret);

        String email    = getString(payload, "email");
        String topicId  = getString(payload, "topicId");
        String topicTitle = getString(payload, "topicTitle");
        String pathSlug = getString(payload, "pathSlug");
        int xp = payload.containsKey("xpEarned")
                ? ((Number) payload.get("xpEarned")).intValue() : 50;

        if (email == null || topicId == null) {
            throw new ApiException("email and topicId are required", HttpStatus.BAD_REQUEST);
        }

        // Find player by email
        Player player = playerRepo.findByEmail(email)
                .orElseThrow(() -> new ApiException(
                        "No player found for email: " + email, HttpStatus.NOT_FOUND));

        // Create learning log entry
        LearningLog created;
        try {
            created = learningService.logDevMasteryTopic(
                    player.getId(), topicId, topicTitle, pathSlug, xp);
        } catch (ApiException e) {
            if (e.getStatus() == HttpStatus.CONFLICT) {
                // Already synced — idempotent response
                log.info("DevMastery topic {} already synced for player {}", topicId, player.getId());
                return Map.of("status", "already_synced", "topicId", topicId);
            }
            throw e;
        }

        log.info("DevMastery webhook: player {} completed topic '{}' — {} XP awarded",
                player.getUsername(), topicTitle, xp);

        return Map.of(
            "status", "ok",
            "logId", created.getId(),
            "xpAwarded", xp,
            "player", player.getUsername()
        );
    }

    /**
     * Manual sync: fetches latest progress from DevMastery API and creates
     * LearningLog entries for any newly completed topics since last sync.
     * Called by the "🔄 Sync DevMastery" button in the UI.
     */
    @PostMapping("/sync")
    public Map<String, Object> manualSync(@RequestBody Map<String, Object> payload) {

        String email = getString(payload, "email");
        if (email == null) throw new ApiException("email is required", HttpStatus.BAD_REQUEST);

        Player player = playerRepo.findByEmail(email)
                .orElseThrow(() -> new ApiException(
                        "No player found for email: " + email, HttpStatus.NOT_FOUND));

        log.info("Manual DevMastery sync requested for player {}", player.getUsername());

        if (devMasteryApiUrl.isBlank()) {
            throw new ApiException("DevMastery API URL not configured", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        // Call DevMastery /api/integration/solo-leveling/progress?email=...
        org.springframework.web.client.RestClient http = org.springframework.web.client.RestClient.create();
        List<Map<String, Object>> topics;
        try {
            topics = http.get()
                    .uri(devMasteryApiUrl + "/api/integration/solo-leveling/progress?email=" + email)
                    .header("X-Webhook-Secret", webhookSecret)
                    .retrieve()
                    .body(new org.springframework.core.ParameterizedTypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            log.error("Failed to fetch progress from DevMastery", e);
            throw new ApiException("Failed to fetch progress from DevMastery: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }

        if (topics == null) topics = List.of();

        int syncedCount = 0;
        int totalXpAwarded = 0;

        for (Map<String, Object> t : topics) {
            String topicId = getString(t, "topicId");
            String topicTitle = getString(t, "topicTitle");
            String pathSlug = getString(t, "pathSlug");
            int xp = t.containsKey("xpEarned") ? ((Number) t.get("xpEarned")).intValue() : 50;

            try {
                learningService.logDevMasteryTopic(player.getId(), topicId, topicTitle, pathSlug, xp);
                syncedCount++;
                totalXpAwarded += xp;
            } catch (ApiException e) {
                // Ignore conflict (already synced)
                if (e.getStatus() != HttpStatus.CONFLICT) {
                    log.warn("Failed to sync topic {}: {}", topicId, e.getMessage());
                }
            }
        }

        log.info("Manual sync complete for {}: synced {} new topics, awarded {} XP",
                player.getUsername(), syncedCount, totalXpAwarded);

        return Map.of(
            "status", "ok",
            "topicsSynced", syncedCount,
            "xpAwarded", totalXpAwarded,
            "player", player.getUsername()
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void validateSecret(String provided) {
        if (webhookSecret.isBlank()) {
            // Secret not configured — allow (useful for local dev)
            log.warn("DevMastery webhook secret not configured — running in open mode");
            return;
        }
        if (!webhookSecret.equals(provided)) {
            throw new ApiException("Invalid webhook secret", HttpStatus.UNAUTHORIZED);
        }
    }

    private String getString(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? String.valueOf(val) : null;
    }
}
