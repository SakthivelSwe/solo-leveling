package com.thesystem.service;

import com.thesystem.entity.Shadow;
import com.thesystem.repository.ShadowRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
public class ShadowService {
    private final ShadowRepository shadowRepo;

    public ShadowService(ShadowRepository shadowRepo) {
        this.shadowRepo = shadowRepo;
    }

    public List<Shadow> getShadowArmy(Long playerId) {
        return shadowRepo.findByPlayerIdOrderByShadowLevelDesc(playerId);
    }

    public Shadow extractDisciplineShadow(Long playerId) {
        // Check if IGRIS already exists for this player (Habit ID = -1 for system-wide discipline)
        if (shadowRepo.existsByPlayerIdAndHabitId(playerId, -1L)) {
            throw new RuntimeException("Discipline shadow already extracted.");
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
}
