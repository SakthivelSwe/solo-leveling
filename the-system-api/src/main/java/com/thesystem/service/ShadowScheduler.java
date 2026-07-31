package com.thesystem.service;

import com.thesystem.repository.PlayerRepository;
import com.thesystem.entity.Player;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ShadowScheduler {

    private final ShadowService shadowService;
    private final PlayerRepository playerRepository;

    public ShadowScheduler(ShadowService shadowService, PlayerRepository playerRepository) {
        this.shadowService = shadowService;
        this.playerRepository = playerRepository;
    }

    @Scheduled(fixedRate = 300000) // Every 5 minutes
    public void checkReturningShadows() {
        List<Player> players = playerRepository.findAll();
        for (Player p : players) {
            shadowService.processReturningShadows(p.getId());
        }
    }
}
