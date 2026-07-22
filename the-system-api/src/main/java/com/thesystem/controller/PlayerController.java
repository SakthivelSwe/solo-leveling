package com.thesystem.controller;

import com.thesystem.dto.PlayerDTO;
import com.thesystem.dto.StatusWindowDTO;
import com.thesystem.dto.UpdateProfileRequest;
import com.thesystem.entity.Player;
import com.thesystem.service.PlayerService;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/player")
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

    /** Permanently deletes the authenticated player's account and all their data. */
    @DeleteMapping("/account")
    public void deleteAccount(Principal principal) {
        playerService.deleteAccount(playerId(principal));
    }

    /**
     * Configure the player's weekly rest day (Cheat Day / Vacation Mode).
     * Body: { "active": true, "dayOfWeek": 7 }  (1=Mon … 7=Sun)
     * When active, the midnight HP scheduler applies reduced thresholds on this day.
     */
    @PatchMapping("/rest-day")
    public PlayerDTO updateRestDay(Principal principal, @RequestBody Map<String, Object> body) {
        boolean active = Boolean.TRUE.equals(body.get("active"));
        int dayOfWeek = body.containsKey("dayOfWeek")
                ? ((Number) body.get("dayOfWeek")).intValue() : 7;
        return playerService.updateRestDay(playerId(principal), active, dayOfWeek);
    }

    private Long playerId(Principal principal) {
        Player player = playerService.getByUsername(principal.getName());
        return player.getId();
    }
}

