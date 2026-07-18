package com.thesystem.controller;

import com.thesystem.dto.TitleDTO;
import com.thesystem.security.CurrentPlayer;
import com.thesystem.service.TitleService;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/** Unlockable Hunter titles — list what's earned and equip one. */
@RestController
@RequestMapping("/api/v1/titles")
public class TitleController {

    private final TitleService titleService;
    private final CurrentPlayer currentPlayer;

    public TitleController(TitleService titleService, CurrentPlayer currentPlayer) {
        this.titleService = titleService;
        this.currentPlayer = currentPlayer;
    }

    @GetMapping
    public List<TitleDTO> list(Principal principal) {
        return titleService.getTitles(currentPlayer.id(principal));
    }

    @PostMapping("/{key}/equip")
    public List<TitleDTO> equip(Principal principal, @PathVariable String key) {
        return titleService.equip(currentPlayer.id(principal), key);
    }
}

