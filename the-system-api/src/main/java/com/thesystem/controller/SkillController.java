package com.thesystem.controller;

import com.thesystem.dto.PlayerSkillDTO;
import com.thesystem.service.PlayerService;
import com.thesystem.service.SkillService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/skills")
public class SkillController {

    private final SkillService skillService;
    private final PlayerService playerService;

    public SkillController(SkillService skillService, PlayerService playerService) {
        this.skillService = skillService;
        this.playerService = playerService;
    }

    @GetMapping
    public List<PlayerSkillDTO> skills(Principal principal) {
        Long playerId = playerService.getByUsername(principal.getName()).getId();
        return skillService.getPlayerSkills(playerId);
    }
}

