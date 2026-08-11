package com.thesystem.controller;

import com.thesystem.entity.Shadow;
import com.thesystem.security.CurrentPlayer;
import com.thesystem.service.ShadowService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/shadows")
public class ShadowController {
    private final ShadowService shadowService;
    private final CurrentPlayer currentPlayer;

    public ShadowController(ShadowService shadowService, CurrentPlayer currentPlayer) {
        this.shadowService = shadowService;
        this.currentPlayer = currentPlayer;
    }

    @GetMapping
    public ResponseEntity<List<Shadow>> getShadowArmy(java.security.Principal principal) {
        return ResponseEntity.ok(shadowService.getShadowArmy(currentPlayer.id(principal)));
    }

    @PostMapping("/extract-discipline")
    public ResponseEntity<Shadow> extractDisciplineShadow(java.security.Principal principal) {
        Shadow s = shadowService.extractDisciplineShadow(currentPlayer.id(principal));
        return ResponseEntity.ok(s);
    }

    @PostMapping("/{shadowId}/dispatch")
    public ResponseEntity<?> dispatchShadow(java.security.Principal principal, @org.springframework.web.bind.annotation.PathVariable Long shadowId, @org.springframework.web.bind.annotation.RequestParam int hours) {
        return ResponseEntity.ok(shadowService.dispatchShadow(currentPlayer.id(principal), shadowId, hours));
    }
}
