package com.thesystem.controller;

import com.thesystem.dto.*;
import com.thesystem.entity.Habit;
import com.thesystem.entity.HabitCompletion;
import com.thesystem.repository.HabitCompletionRepository;
import com.thesystem.repository.HabitRepository;
import com.thesystem.exception.ApiException;
import com.thesystem.service.HabitService;
import com.thesystem.service.HabitTemplateService;
import com.thesystem.service.PlayerService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/habits")
public class HabitController {

    private final HabitService habitService;
    private final HabitTemplateService templateService;
    private final PlayerService playerService;
    private final HabitRepository habitRepository;
    private final HabitCompletionRepository completionRepository;

    public HabitController(HabitService habitService,
                           HabitTemplateService templateService,
                           PlayerService playerService,
                           HabitRepository habitRepository,
                           HabitCompletionRepository completionRepository) {
        this.habitService = habitService;
        this.templateService = templateService;
        this.playerService = playerService;
        this.habitRepository = habitRepository;
        this.completionRepository = completionRepository;
    }

    @GetMapping
    public HabitsOverviewDTO overview(Principal principal) {
        return habitService.overview(playerId(principal));
    }

    @GetMapping("/list")
    public List<HabitDTO> list(Principal principal) {
        return habitService.list(playerId(principal));
    }

    @PostMapping
    public HabitDTO create(Principal principal, @RequestBody Habit body) {
        return habitService.create(playerId(principal), body);
    }

    @PutMapping("/{id}")
    public HabitDTO update(Principal principal, @PathVariable Long id, @RequestBody Habit body) {
        return habitService.update(playerId(principal), id, body);
    }

    @DeleteMapping("/{id}")
    public void archive(Principal principal, @PathVariable Long id) {
        habitService.archive(playerId(principal), id);
    }

    @PostMapping("/{id}/complete")
    public HabitCompletionResult complete(Principal principal, @PathVariable Long id,
                                          @RequestBody(required = false) Map<String, Object> body) {
        int quality = 3;
        boolean twoMinute = false;
        String note = null;
        if (body != null) {
            if (body.get("quality") != null) quality = Integer.parseInt(body.get("quality").toString());
            if (body.get("twoMinute") != null) twoMinute = Boolean.parseBoolean(body.get("twoMinute").toString());
            if (body.get("note") != null) note = body.get("note").toString();
        }
        return habitService.complete(playerId(principal), id, quality, twoMinute, note);
    }

    @GetMapping("/templates")
    public List<HabitTemplateDTO> templates(Principal principal, @RequestParam(required = false) String rank) {
        if (rank == null || rank.isBlank()) {
            String r = playerService.getByUsername(principal.getName()).getRankLevel();
            return templateService.forRank(r);
        }
        return templateService.forRank(rank);
    }

    /** Per-habit completion history (Cue Log journal) — newest first, capped at 60. */
    @GetMapping("/{id}/history")
    public List<Map<String, Object>> history(Principal principal, @PathVariable Long id) {
        Long pid = playerId(principal);
        Habit h = habitRepository.findById(id)
                .orElseThrow(() -> new ApiException("Habit not found", HttpStatus.NOT_FOUND));
        if (!h.getPlayerId().equals(pid)) {
            throw new ApiException("Not your habit", HttpStatus.FORBIDDEN);
        }
        List<HabitCompletion> list = completionRepository.findByHabitIdOrderByCompletedAtDesc(id);
        return list.stream().limit(60).map(c -> {
            Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("date", c.getCompletedAt().toString());
            m.put("quality", c.getQuality());
            m.put("xpGained", c.getXpGained());
            m.put("twoMinute", c.isTwoMinute());
            m.put("note", c.getNote());
            return m;
        }).toList();
    }

    @PostMapping("/templates/{key}/adopt")
    public HabitDTO adoptTemplate(Principal principal, @PathVariable String key) {
        HabitTemplateDTO t = templateService.all().stream()
                .filter(x -> x.key().equals(key)).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Template not found: " + key));
        Habit h = new Habit();
        h.setName(t.name());
        h.setIdentityTag(t.identityTag());
        h.setCue(t.cue());
        h.setCraving(t.craving());
        h.setRoutine(t.routine());
        h.setReward(t.reward());
        h.setTwoMinuteVersion(t.twoMinuteVersion());
        h.setCueTime(t.cueTime());
        h.setDifficulty(t.difficulty());
        h.setKeystone(t.keystone());
        return habitService.create(playerId(principal), h);
    }

    private Long playerId(Principal principal) {
        return playerService.getByUsername(principal.getName()).getId();
    }
}

