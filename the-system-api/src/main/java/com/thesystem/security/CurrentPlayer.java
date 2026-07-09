package com.thesystem.security;

import com.thesystem.entity.Player;
import com.thesystem.exception.ApiException;
import com.thesystem.repository.PlayerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.security.Principal;

/**
 * Resolves the authenticated player's id from the security Principal.
 * Shared by all Life-OS controllers to keep endpoints player-scoped.
 */
@Component
public class CurrentPlayer {

    private final PlayerRepository playerRepository;

    public CurrentPlayer(PlayerRepository playerRepository) {
        this.playerRepository = playerRepository;
    }

    public Long id(Principal principal) {
        return player(principal).getId();
    }

    public Player player(Principal principal) {
        if (principal == null) {
            throw new ApiException("Not authenticated", HttpStatus.UNAUTHORIZED);
        }
        return playerRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new ApiException("Player not found", HttpStatus.NOT_FOUND));
    }
}

