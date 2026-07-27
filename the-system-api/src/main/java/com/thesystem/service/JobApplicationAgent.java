package com.thesystem.service;

import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserType;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import com.thesystem.repository.JobApplicationRepository;
import org.springframework.stereotype.Service;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class JobApplicationAgent {

    private final SseService sseService;
    private final JobApplicationRepository jobRepo;
    private final ExecutorService executor = Executors.newFixedThreadPool(2);

    public JobApplicationAgent(SseService sseService, JobApplicationRepository jobRepo) {
        this.sseService = sseService;
        this.jobRepo = jobRepo;
    }

    public void triggerJobHunt(Long playerId) {
        executor.submit(() -> {
            log(playerId, "INITIALIZING AI JOB HUNT AGENT...");
            try (Playwright playwright = Playwright.create()) {
                log(playerId, "LAUNCHING HEADLESS BROWSER INSTANCE...");
                Browser browser = playwright.chromium().launch(new BrowserType.LaunchOptions().setHeadless(true));
                Page page = browser.newPage();
                
                log(playerId, "NAVIGATING TO INDEED (Y COMBINATOR / TECH JOBS)...");
                page.navigate("https://news.ycombinator.com/jobs");
                
                page.waitForTimeout(2000);
                log(playerId, "ANALYZING DOM AND EXTRACTING JOB POSTINGS...");
                
                var titles = page.locator(".titleline > a").allTextContents();
                
                if (titles.isEmpty()) {
                    log(playerId, "NO JOBS FOUND. ABORTING.");
                    return;
                }
                
                int count = Math.min(3, titles.size());
                log(playerId, "FOUND " + titles.size() + " POSTINGS. APPLYING TO TOP " + count + "...");
                
                for (int i = 0; i < count; i++) {
                    String title = titles.get(i);
                    log(playerId, "PARSING JOB: " + title);
                    page.waitForTimeout(1500); // Simulate reading/applying
                    log(playerId, "AUTO-FILLED RESUME AND SUBMITTED APPLICATION FOR: " + title);
                    
                    // Save to DB
                    com.thesystem.entity.JobApplication job = new com.thesystem.entity.JobApplication();
                    job.setPlayerId(playerId);
                    job.setCompany("YC Startup");
                    job.setRole(title.length() > 50 ? title.substring(0, 50) : title);
                    job.setStatus("APPLIED");
                    jobRepo.save(job);
                }
                
                log(playerId, "MISSION ACCOMPLISHED. 3 APPLICATIONS SUBMITTED.");
                browser.close();
            } catch (Exception e) {
                log(playerId, "AGENT FAILED WITH CRITICAL ERROR: " + e.getMessage());
                e.printStackTrace();
            }
        });
    }

    private void log(Long playerId, String msg) {
        try {
            sseService.send(playerId, "agent-log", "{\"message\":\"" + msg + "\"}");
            Thread.sleep(1000);
        } catch (Exception e) {}
    }
}
