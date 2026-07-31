package com.thesystem.controller;

import com.thesystem.entity.JobChangeQuest;
import com.thesystem.security.CurrentPlayer;
import com.thesystem.service.JobChangeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/job-change")
public class JobChangeController {

    private final JobChangeService service;
    private final CurrentPlayer currentPlayer;

    public JobChangeController(JobChangeService service, CurrentPlayer currentPlayer) {
        this.service = service;
        this.currentPlayer = currentPlayer;
    }

    @GetMapping
    public ResponseEntity<JobChangeQuest> getQuestStatus(java.security.Principal principal) {
        // This will also trigger the check if the user hit level 10
        return ResponseEntity.ok(service.checkAndTrigger(currentPlayer.id(principal)));
    }
}
