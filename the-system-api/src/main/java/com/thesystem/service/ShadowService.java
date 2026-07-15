package com.thesystem.service;

import com.thesystem.entity.Shadow;
import com.thesystem.repository.ShadowRepository;
import org.springframework.stereotype.Service;
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
}
