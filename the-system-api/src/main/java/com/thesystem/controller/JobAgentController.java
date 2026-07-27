package com.thesystem.controller;

import com.thesystem.service.JobApplicationAgent;
import com.thesystem.security.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;

@RestController
@RequestMapping("/api/v1/jobs")
public class JobAgentController {

    private final JobApplicationAgent agent;

    public JobAgentController(JobApplicationAgent agent) {
        this.agent = agent;
    }

    @PostMapping("/auto-apply")
    public ResponseEntity<String> triggerAutoApply(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        Long playerId = Long.parseLong(principal.getName());
        agent.triggerJobHunt(playerId);
        return ResponseEntity.ok("Agent triggered");
    }
}
