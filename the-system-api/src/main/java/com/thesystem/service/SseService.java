package com.thesystem.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Real-time channel — THE SYSTEM's live link to each Hunter.
 * Holds one or more {@link SseEmitter} per player (multiple browser tabs supported)
 * and pushes System events (notifications, XP/HP/rank changes) the instant they happen.
 * A 25s heartbeat keeps idle connections alive and prunes dead ones.
 */
@Service
public class SseService {

    private static final Logger log = LoggerFactory.getLogger(SseService.class);
    /** 30 minutes — the browser EventSource auto-reconnects afterwards. */
    private static final long TIMEOUT_MS = 30 * 60 * 1000L;

    private final Map<Long, List<SseEmitter>> emitters = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /** Register a new live connection for a player. */
    public SseEmitter subscribe(Long playerId) {
        SseEmitter emitter = new SseEmitter(TIMEOUT_MS);
        emitters.computeIfAbsent(playerId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> remove(playerId, emitter));
        emitter.onTimeout(() -> { emitter.complete(); remove(playerId, emitter); });
        emitter.onError(e -> remove(playerId, emitter));

        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data("{\"message\":\"◈ THE SYSTEM link established\"}"));
        } catch (IOException e) {
            remove(playerId, emitter);
        }
        log.debug("◈ SSE link opened for player {} ({} active).", playerId, count(playerId));
        return emitter;
    }

    /** Push an event to every live tab of a single player. */
    public void send(Long playerId, String event, Object data) {
        List<SseEmitter> list = emitters.get(playerId);
        if (list == null || list.isEmpty()) return;
        String json = toJson(data);
        for (SseEmitter emitter : list) {
            try {
                emitter.send(SseEmitter.event().name(event).data(json));
            } catch (Exception e) {
                remove(playerId, emitter);
            }
        }
    }

    /** Push an event to every connected player. */
    public void broadcast(String event, Object data) {
        emitters.keySet().forEach(id -> send(id, event, data));
    }

    /** Keep-alive ping so proxies / browsers don't drop idle streams. */
    @Scheduled(fixedRate = 25_000)
    public void heartbeat() {
        emitters.forEach((playerId, list) -> {
            for (SseEmitter emitter : list) {
                try {
                    emitter.send(SseEmitter.event().comment("ping"));
                } catch (Exception e) {
                    remove(playerId, emitter);
                }
            }
        });
    }

    private int count(Long playerId) {
        List<SseEmitter> list = emitters.get(playerId);
        return list == null ? 0 : list.size();
    }

    private void remove(Long playerId, SseEmitter emitter) {
        List<SseEmitter> list = emitters.get(playerId);
        if (list != null) {
            list.remove(emitter);
            if (list.isEmpty()) emitters.remove(playerId);
        }
    }

    private String toJson(Object data) {
        try {
            return objectMapper.writeValueAsString(data);
        } catch (Exception e) {
            return "{}";
        }
    }
}

