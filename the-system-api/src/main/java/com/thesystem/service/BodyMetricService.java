package com.thesystem.service;

import com.thesystem.entity.BodyMetric;
import com.thesystem.repository.BodyMetricRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

/**
 * Phase 2 — Body Metrics OS: daily weight + body-fat logging with history for
 * the trend graph. One row per day (upsert), same pattern as the other Life-OS
 * daily logs.
 */
@Service
public class BodyMetricService {

    private final BodyMetricRepository repo;

    public BodyMetricService(BodyMetricRepository repo) {
        this.repo = repo;
    }

    public BodyMetric upsert(Long playerId, BodyMetric body) {
        LocalDate date = body.getLogDate() != null ? body.getLogDate() : LocalDate.now();
        BodyMetric m = repo.findByPlayerIdAndLogDate(playerId, date).orElseGet(BodyMetric::new);
        m.setPlayerId(playerId);
        m.setLogDate(date);
        if (body.getWeightKg() != null) m.setWeightKg(body.getWeightKg());
        if (body.getBodyFatPct() != null) m.setBodyFatPct(body.getBodyFatPct());
        m.setNote(body.getNote());
        return repo.save(m);
    }

    public BodyMetric today(Long playerId) {
        return repo.findByPlayerIdAndLogDate(playerId, LocalDate.now()).orElse(null);
    }

    /** Most-recent first (the UI reverses for the left-to-right chart). */
    public List<BodyMetric> history(Long playerId) {
        return repo.findByPlayerIdOrderByLogDateDesc(playerId);
    }
}

