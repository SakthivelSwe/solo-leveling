package com.thesystem.controller;

import com.thesystem.dto.PlayerDTO;
import com.thesystem.dto.StatusWindowDTO;
import com.thesystem.dto.UpdateProfileRequest;
import com.thesystem.entity.Player;
import com.thesystem.service.PlayerService;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/player")
public class PlayerController {

    private final PlayerService playerService;

    public PlayerController(PlayerService playerService) {
        this.playerService = playerService;
    }

    @GetMapping("/status")
    public StatusWindowDTO status(Principal principal) {
        return playerService.getStatusWindow(playerId(principal));
    }

    @GetMapping("/profile")
    public PlayerDTO profile(Principal principal) {
        return playerService.getProfile(playerId(principal));
    }

    @PutMapping("/profile")
    public PlayerDTO updateProfile(Principal principal, @RequestBody UpdateProfileRequest request) {
        return playerService.updateProfile(playerId(principal), request);
    }

    private Long playerId(Principal principal) {
        Player player = playerService.getByUsername(principal.getName());
        return player.getId();
    }
}

