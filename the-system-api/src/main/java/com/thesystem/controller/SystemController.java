package com.thesystem.controller;

import com.thesystem.dto.PlayerDTO;
import com.thesystem.entity.Player;
import com.thesystem.repository.PlayerRepository;
import com.thesystem.service.PlayerService;
import com.thesystem.service.SystemQuoteService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Miscellaneous SYSTEM endpoints: the daily rotating quote and the leaderboard.
 */
@RestController
@RequestMapping("/api/v1/system")
public class SystemController {

    private final SystemQuoteService systemQuoteService;
    private final PlayerRepository playerRepository;
    private final PlayerService playerService;

    public SystemController(SystemQuoteService systemQuoteService,
                            PlayerRepository playerRepository,
                            PlayerService playerService) {
        this.systemQuoteService = systemQuoteService;
        this.playerRepository = playerRepository;
        this.playerService = playerService;
    }

    @GetMapping("/quote")
    public Map<String, String> quote() {
        return Map.of("quote", systemQuoteService.quoteForToday());
    }

    @GetMapping("/leaderboard")
    public List<PlayerDTO> leaderboard() {
        return playerRepository.findTop10ByOrderByTotalXpDesc()
                .stream().map(playerService::toDto).toList();
    }
}

