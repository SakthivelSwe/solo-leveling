package com.thesystem.controller;

import com.thesystem.dto.FlashcardDTO;
import com.thesystem.security.CurrentPlayer;
import com.thesystem.service.SrsService;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/flashcards")
public class FlashcardController {

    private final SrsService srsService;
    private final CurrentPlayer currentPlayer;

    public FlashcardController(SrsService srsService, CurrentPlayer currentPlayer) {
        this.srsService = srsService;
        this.currentPlayer = currentPlayer;
    }

    @GetMapping("/due")
    public List<FlashcardDTO> getDue(Principal p) {
        return srsService.getDueCards(currentPlayer.id(p));
    }

    @PostMapping("/add")
    public FlashcardDTO add(Principal p, @RequestBody Map<String, String> body) {
        return srsService.addCard(
            currentPlayer.id(p),
            body.get("frontText"),
            body.get("backText"),
            body.getOrDefault("topic", "General")
        );
    }

    @PostMapping("/{id}/review")
    public FlashcardDTO review(Principal p, @PathVariable Long id, @RequestBody Map<String, Integer> body) {
        return srsService.reviewCard(currentPlayer.id(p), id, body.getOrDefault("rating", 1));
    }
}
