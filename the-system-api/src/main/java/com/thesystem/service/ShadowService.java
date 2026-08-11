package com.thesystem.service;

import com.thesystem.entity.Shadow;
import com.thesystem.exception.ApiException;
import com.thesystem.repository.ShadowRepository;
import com.thesystem.repository.PlayerRepository;
import com.thesystem.entity.Player;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class ShadowService {
    private final ShadowRepository shadowRepo;
    private final PlayerRepository playerRepo;

    public ShadowService(ShadowRepository shadowRepo, PlayerRepository playerRepo) {
        this.shadowRepo = shadowRepo;
        this.playerRepo = playerRepo;
    }

    public List<Shadow> getShadowArmy(Long playerId) {
        return shadowRepo.findByPlayerIdOrderByShadowLevelDesc(playerId);
    }

    public Shadow extractDisciplineShadow(Long playerId) {
        // Check if IGRIS already exists for this player (Habit ID = -1 for system-wide discipline)
        if (shadowRepo.existsByPlayerIdAndHabitId(playerId, -1L)) {
            throw new ApiException("Discipline shadow already extracted.", HttpStatus.CONFLICT);
        }
        
        Shadow igris = new Shadow();
        igris.setPlayerId(playerId);
        igris.setHabitId(-1L);
        igris.setShadowName("IGRIS (Discipline)");
        igris.setShadowType("SHADOW_MONARCH");
        igris.setShadowLevel(1);
        igris.setPowerLevel(9999);
        igris.setStreakAtActivation(90);
        igris.setActiveSince(LocalDate.now());
        
        return shadowRepo.save(igris);
    }

    public Shadow dispatchShadow(Long playerId, Long shadowId, int hours) {
        Shadow s = shadowRepo.findById(shadowId)
                .orElseThrow(() -> new ApiException("Shadow not found", HttpStatus.NOT_FOUND));
        if (!s.getPlayerId().equals(playerId))
            throw new ApiException("You do not have permission to dispatch this shadow", HttpStatus.FORBIDDEN);
        if (s.isDeployed())
            throw new ApiException("Shadow already deployed", HttpStatus.CONFLICT);
        
        s.setDeployed(true);
        s.setExpeditionEndTime(LocalDateTime.now().plusHours(hours));
        return shadowRepo.save(s);
    }

    public void processReturningShadows(Long playerId) {
        List<Shadow> deployed = shadowRepo.findByPlayerIdAndDeployedTrue(playerId);
        LocalDateTime now = LocalDateTime.now();
        Player player = null;

        for (Shadow s : deployed) {
            if (s.getExpeditionEndTime() != null && now.isAfter(s.getExpeditionEndTime())) {
                s.setDeployed(false);
                s.setExpeditionEndTime(null);
                shadowRepo.save(s);
                
                // Reward logic
                if (playerRepo != null) {
                    if (player == null) player = playerRepo.findById(playerId).orElse(null);
                    if (player != null) {
                        int goldFound = s.getShadowLevel() * 100 + ThreadLocalRandom.current().nextInt(50);
                        player.setSystemGold(player.getSystemGold() + goldFound);
                        playerRepo.save(player);
                    }
                }
            }
        }
    }
}
