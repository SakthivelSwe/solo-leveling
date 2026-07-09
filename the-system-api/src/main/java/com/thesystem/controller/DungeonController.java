package com.thesystem.controller;

import com.thesystem.dto.DungeonDTO;
import com.thesystem.security.CurrentPlayer;
import com.thesystem.service.DungeonService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

/** Weekly Gate raid — the current week's boss and clear progress. */
@RestController
@RequestMapping("/api/dungeon")
public class DungeonController {

    private final DungeonService dungeonService;
    private final CurrentPlayer currentPlayer;

    public DungeonController(DungeonService dungeonService, CurrentPlayer currentPlayer) {
        this.dungeonService = dungeonService;
        this.currentPlayer = currentPlayer;
    }

    @GetMapping
    public DungeonDTO current(Principal principal) {
        return dungeonService.getCurrentDungeon(currentPlayer.id(principal));
    }
}

