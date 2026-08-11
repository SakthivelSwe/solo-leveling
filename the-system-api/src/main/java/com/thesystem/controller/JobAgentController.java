package com.thesystem.controller;

import com.thesystem.security.CurrentPlayer;
import com.thesystem.service.JobApplicationAgent;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/jobs")
public class JobAgentController {

    private final JobApplicationAgent agent;
    private final CurrentPlayer currentPlayer;

    public JobAgentController(JobApplicationAgent agent, CurrentPlayer currentPlayer) {
        this.agent = agent;
        this.currentPlayer = currentPlayer;
    }

    @PostMapping("/auto-apply")
    public ResponseEntity<String> triggerAutoApply(Principal p) {
        // BUG FIX: principal.getName() is the JWT username/email string — not a numeric ID.
        // Use CurrentPlayer.id() which correctly resolves it to the player's database ID.
        agent.triggerJobHunt(currentPlayer.id(p));
        return ResponseEntity.ok("Agent triggered");
    }
}
