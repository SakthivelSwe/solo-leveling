package com.thesystem.controller;

import com.thesystem.dto.BossBattleDTO;
import com.thesystem.dto.EvaluationDTO;
import com.thesystem.security.CurrentPlayer;
import com.thesystem.service.BossBattleService;
import com.thesystem.service.PlayerService;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/boss-battle")
public class BossBattleController {

    private final BossBattleService battleService;
    private final PlayerService playerService;
    private final CurrentPlayer currentPlayer;

    public BossBattleController(BossBattleService battleService, PlayerService playerService,
                                 CurrentPlayer currentPlayer) {
        this.battleService = battleService;
        this.playerService = playerService;
        this.currentPlayer = currentPlayer;
    }

    @PostMapping("/start")
    public BossBattleDTO start(Principal p, @RequestBody Map<String, String> body) {
        String topic      = body.getOrDefault("topic",      "Spring Boot REST APIs");
        String difficulty = body.getOrDefault("difficulty", "MEDIUM");
        return battleService.startBattle(currentPlayer.id(p), topic, difficulty);
    }

    @PostMapping("/{id}/answer")
    public EvaluationDTO answer(Principal p,
                                 @PathVariable Long id,
                                 @RequestBody Map<String, Object> body) {
        int idx     = ((Number) body.getOrDefault("questionIndex", 0)).intValue();
        String ans  = String.valueOf(body.getOrDefault("answer", ""));
        return battleService.answerQuestion(currentPlayer.id(p), id, idx, ans);
    }

    @PostMapping("/{id}/complete")
    public BossBattleDTO complete(Principal p, @PathVariable Long id) {
        return battleService.completeBattle(currentPlayer.id(p), id);
    }

    @GetMapping("/{id}")
    public BossBattleDTO get(Principal p, @PathVariable Long id) {
        return battleService.getBattle(currentPlayer.id(p), id);
    }

    @GetMapping("/history")
    public List<BossBattleDTO> history(Principal p) {
        return battleService.history(currentPlayer.id(p));
    }
}

