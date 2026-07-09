package com.thesystem.controller;

import com.thesystem.entity.BodyLog;
import com.thesystem.security.CurrentPlayer;
import com.thesystem.service.BodyService;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/body")
public class BodyController {

    private final BodyService bodyService;
    private final CurrentPlayer currentPlayer;

    public BodyController(BodyService bodyService, CurrentPlayer currentPlayer) {
        this.bodyService = bodyService;
        this.currentPlayer = currentPlayer;
    }

    @PostMapping("/log")
    public BodyLog upsert(Principal p, @RequestBody BodyLog body) {
        return bodyService.upsert(currentPlayer.id(p), body);
    }

    @GetMapping("/today")
    public BodyLog today(Principal p) {
        return bodyService.today(currentPlayer.id(p));
    }

    @GetMapping("/history")
    public List<BodyLog> history(Principal p) {
        return bodyService.history(currentPlayer.id(p));
    }
}

