package com.thesystem.controller;

import com.thesystem.dto.AiCommanderBriefingDTO;
import com.thesystem.security.CurrentPlayer;
import com.thesystem.service.AiCommanderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai/commander")
public class AiCommanderController {

    private final AiCommanderService aiCommanderService;
    private final CurrentPlayer currentPlayer;

    public AiCommanderController(AiCommanderService aiCommanderService, CurrentPlayer currentPlayer) {
        this.aiCommanderService = aiCommanderService;
        this.currentPlayer = currentPlayer;
    }

    @GetMapping("/briefing")
    public ResponseEntity<AiCommanderBriefingDTO> getMorningBriefing(java.security.Principal principal) {
        AiCommanderBriefingDTO briefing = aiCommanderService.getMorningBriefing(currentPlayer.id(principal));
        return ResponseEntity.ok(briefing);
    }
}
