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

    public SkillTreeController(SkillTreeService skillTreeService) {
        this.skillTreeService = skillTreeService;
    }

    @GetMapping
    public List<SkillTreeNode> getNodes(@RequestHeader("X-Player-Id") Long playerId) {
        return skillTreeService.getNodes(playerId);
    }
}
