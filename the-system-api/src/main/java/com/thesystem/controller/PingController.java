package com.thesystem.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PingController {

    /**
     * An empty API endpoint that just returns 200 OK.
     * Used by the keep-alive scheduler to prevent the Render free-tier from sleeping.
     */
    @GetMapping("/api/public/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("pong");
    }

    @GetMapping("/")
    public ResponseEntity<String> root() {
        return ResponseEntity.ok("System Online");
    }
}
