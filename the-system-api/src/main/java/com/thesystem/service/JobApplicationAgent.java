package com.thesystem.service;

import org.springframework.stereotype.Service;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Autonomous job-hunt agent.
 *
 * <p>The original implementation drove a headless Chromium browser via Playwright
 * to scrape and "auto-apply" to job postings. That dependency (~400 MB once the
 * browser binaries are installed) cannot run on the 512 MB Render free tier and
 * was a major source of cold-start slowness and out-of-memory risk, so the
 * Playwright dependency has been removed.</p>
 *
 * <p>The public API ({@code triggerJobHunt}) and the SSE {@code agent-log} stream
 * are preserved so the existing UI keeps working — the agent now streams a clear
 * status message instead of failing with a cryptic {@code Playwright.create()}
 * browser-launch error. To re-enable real browser automation, run this logic on a
 * dedicated worker service (not the free web tier) with the Playwright dependency
 * plus {@code npx playwright install chromium}.</p>
 */
@Service
public class JobApplicationAgent {

    private final SseService sseService;
    private final ExecutorService executor = Executors.newFixedThreadPool(2);

    public JobApplicationAgent(SseService sseService) {
        this.sseService = sseService;
    }

    public void triggerJobHunt(Long playerId) {
        executor.submit(() -> {
            log(playerId, "INITIALIZING AI JOB HUNT AGENT...");
            log(playerId, "AUTONOMOUS BROWSER AUTOMATION IS DISABLED ON THIS DEPLOYMENT.");
            log(playerId, "This build runs on a memory-constrained tier without a headless browser.");
            log(playerId, "Log applications manually in Career OS, or deploy the agent on a dedicated worker.");
            log(playerId, "MISSION ABORTED — NO BROWSER RUNTIME AVAILABLE.");
        });
    }

    private void log(Long playerId, String msg) {
        try {
            sseService.send(playerId, "agent-log", "{\"message\":\"" + msg + "\"}");
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } catch (Exception ignored) {
            // Non-fatal — SSE delivery is best-effort.
        }
    }
}
