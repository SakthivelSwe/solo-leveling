package com.thesystem.scheduler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class KeepAliveScheduler {
    private static final Logger log = LoggerFactory.getLogger(KeepAliveScheduler.class);
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${RENDER_EXTERNAL_URL:http://localhost:${server.port:8080}}")
    private String appUrl;

    /**
     * Pings the empty API every 14 minutes (840000 ms) to keep the Render free tier alive.
     */
    @Scheduled(initialDelay = 840000, fixedRate = 840000)
    public void pingSelf() {
        try {
            String targetUrl = appUrl + "/api/public/ping";
            log.info("Ping scheduler: sending keep-alive request to {}", targetUrl);
            String response = restTemplate.getForObject(targetUrl, String.class);
            log.info("Ping scheduler: received '{}'", response);
        } catch (Exception e) {
            log.warn("Ping scheduler failed to ping self: {}", e.getMessage());
        }
    }
}
