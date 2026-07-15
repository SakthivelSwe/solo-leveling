package com.thesystem.controller;

import com.thesystem.entity.Shadow;
import com.thesystem.service.ShadowService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/shadows")
public class ShadowController {
    private final ShadowService shadowService;

    public ShadowController(ShadowService shadowService) {
        this.shadowService = shadowService;
    }

    @GetMapping
    public List<Shadow> getShadows(@RequestHeader("X-Player-Id") Long playerId) {
        return shadowService.getShadowArmy(playerId);
    }
}
