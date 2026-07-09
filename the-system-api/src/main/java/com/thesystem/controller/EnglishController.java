package com.thesystem.controller;

import com.thesystem.entity.EnglishLog;
import com.thesystem.entity.VocabularyLog;
import com.thesystem.security.CurrentPlayer;
import com.thesystem.service.EnglishService;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/english")
public class EnglishController {

    private final EnglishService englishService;
    private final CurrentPlayer currentPlayer;

    public EnglishController(EnglishService englishService, CurrentPlayer currentPlayer) {
        this.englishService = englishService;
        this.currentPlayer = currentPlayer;
    }

    @PostMapping("/log")
    public EnglishLog upsert(Principal p, @RequestBody EnglishLog body) {
        return englishService.upsert(currentPlayer.id(p), body);
    }

    @GetMapping("/history")
    public List<EnglishLog> history(Principal p) {
        return englishService.history(currentPlayer.id(p));
    }

    @PostMapping("/vocabulary")
    public VocabularyLog addWord(Principal p, @RequestBody VocabularyLog body) {
        return englishService.addWord(currentPlayer.id(p), body);
    }

    @GetMapping("/vocabulary")
    public List<VocabularyLog> vocabulary(Principal p) {
        return englishService.vocabulary(currentPlayer.id(p));
    }
}

