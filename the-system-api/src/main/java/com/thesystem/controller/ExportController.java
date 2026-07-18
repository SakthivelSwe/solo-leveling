package com.thesystem.controller;

import com.thesystem.security.CurrentPlayer;
import com.thesystem.service.ExportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.Map;

/**
 * Phase 4 — Data Export: a full personal-backup JSON of the player's own data.
 */
@RestController
@RequestMapping("/api/v1/export")
public class ExportController {

    private final ExportService exportService;
    private final CurrentPlayer currentPlayer;

    public ExportController(ExportService exportService, CurrentPlayer currentPlayer) {
        this.exportService = exportService;
        this.currentPlayer = currentPlayer;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> export(Principal p) {
        Map<String, Object> data = exportService.exportAll(currentPlayer.player(p));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"the-system-backup.json\"")
                .contentType(MediaType.APPLICATION_JSON)
                .body(data);
    }
}

