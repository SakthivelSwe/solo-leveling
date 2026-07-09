package com.thesystem.controller;

import com.thesystem.entity.RelationshipLog;
import com.thesystem.security.CurrentPlayer;
import com.thesystem.service.RelationshipService;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/relationship")
public class RelationshipController {

    private final RelationshipService relationshipService;
    private final CurrentPlayer currentPlayer;

    public RelationshipController(RelationshipService relationshipService, CurrentPlayer currentPlayer) {
        this.relationshipService = relationshipService;
        this.currentPlayer = currentPlayer;
    }

    @PostMapping("/log")
    public RelationshipLog upsert(Principal p, @RequestBody RelationshipLog body) {
        return relationshipService.upsert(currentPlayer.id(p), body);
    }

    @GetMapping("/today")
    public RelationshipLog today(Principal p) {
        return relationshipService.today(currentPlayer.id(p));
    }

    @GetMapping("/history")
    public List<RelationshipLog> history(Principal p) {
        return relationshipService.history(currentPlayer.id(p));
    }
}

