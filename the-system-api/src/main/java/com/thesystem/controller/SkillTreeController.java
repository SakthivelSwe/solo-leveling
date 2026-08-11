package com.thesystem.controller;

import com.thesystem.entity.SkillTreeNode;
import com.thesystem.service.SkillTreeService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/skill-tree")
public class SkillTreeController {

    private final SkillTreeService skillTreeService;
    private final com.thesystem.security.CurrentPlayer currentPlayer;

    public SkillTreeController(SkillTreeService skillTreeService, com.thesystem.security.CurrentPlayer currentPlayer) {
        this.skillTreeService = skillTreeService;
        this.currentPlayer = currentPlayer;
    }

    @GetMapping
    public List<SkillTreeNode> getNodes(java.security.Principal principal) {
        return skillTreeService.getNodes(currentPlayer.id(principal));
    }
}
