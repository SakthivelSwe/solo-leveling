package com.thesystem.controller;

import com.thesystem.security.CurrentPlayer;
import com.thesystem.service.SseService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.security.Principal;

/**
 * Live event stream — GET /api/stream (Server-Sent Events).
 * The browser's EventSource cannot set an Authorization header, so the JWT is
 * supplied as a {@code ?token=} query param and validated by {@code JwtAuthFilter}.
 */
@RestController
@RequestMapping("/api/stream")
public class StreamController {

    private final SseService sseService;
    private final CurrentPlayer currentPlayer;

    public StreamController(SseService sseService, CurrentPlayer currentPlayer) {
        this.sseService = sseService;
        this.currentPlayer = currentPlayer;
    }

    @CrossOrigin(originPatterns = {
            "http://localhost:*", "http://localhost", "https://localhost", "capacitor://localhost"
    })
    @GetMapping(produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(Principal principal) {
        return sseService.subscribe(currentPlayer.id(principal));
    }
}

