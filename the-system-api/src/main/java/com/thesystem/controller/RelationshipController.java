package com.thesystem.controller;

import com.thesystem.entity.RelationshipLog;
import com.thesystem.security.CurrentPlayer;
import com.thesystem.service.RelationshipService;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/relationship")
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
    @GetMapping("/connections")
    public List<com.thesystem.entity.SocialConnection> getConnections(Principal p) {
        return relationshipService.getConnections(currentPlayer.id(p));
    }

    @PostMapping("/connections")
    public com.thesystem.entity.SocialConnection addConnection(Principal p, @RequestBody com.thesystem.entity.SocialConnection body) {
        return relationshipService.addConnection(currentPlayer.id(p), body);
    }

    @PutMapping("/connections/{id}/contact")
    public com.thesystem.entity.SocialConnection updateContact(Principal p, @PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        return relationshipService.updateContact(currentPlayer.id(p), id, java.time.LocalDate.parse(body.get("date")));
    }
}

