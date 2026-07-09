package com.thesystem.service;

import com.thesystem.entity.BodyLog;
import com.thesystem.repository.BodyLogRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

/**
 * Module 6 — Body OS: the 7 testosterone pillars tracked per day.
 */
@Service
public class BodyService {

    private final BodyLogRepository bodyRepo;

    public BodyService(BodyLogRepository bodyRepo) {
        this.bodyRepo = bodyRepo;
    }

    public BodyLog upsert(Long playerId, BodyLog body) {
        LocalDate date = body.getLogDate() != null ? body.getLogDate() : LocalDate.now();
        BodyLog log = bodyRepo.findByPlayerIdAndLogDate(playerId, date).orElseGet(BodyLog::new);
        log.setPlayerId(playerId);
        log.setLogDate(date);
        log.setColdShower(body.isColdShower());
        log.setMorningSunMin(body.getMorningSunMin());
        log.setZincMeal(body.isZincMeal());
        log.setNoSoda(body.isNoSoda());
        log.setNoPorn(body.isNoPorn());
        log.setExerciseDone(body.isExerciseDone());
        log.setSleptBefore1130(body.isSleptBefore1130());
        // Recompute the 7-pillar score
        int pillars = 0;
        if (log.isColdShower()) pillars++;
        if (log.getMorningSunMin() >= 10) pillars++;
        if (log.isZincMeal()) pillars++;
        if (log.isNoSoda()) pillars++;
        if (log.isNoPorn()) pillars++;
        if (log.isExerciseDone()) pillars++;
        if (log.isSleptBefore1130()) pillars++;
        log.setTestosteronePillars(pillars);
        return bodyRepo.save(log);
    }

    public BodyLog today(Long playerId) {
        return bodyRepo.findByPlayerIdAndLogDate(playerId, LocalDate.now()).orElse(null);
    }

    public List<BodyLog> history(Long playerId) {
        return bodyRepo.findByPlayerIdOrderByLogDateDesc(playerId);
    }
}

