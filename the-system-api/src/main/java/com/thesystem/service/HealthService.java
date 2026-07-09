package com.thesystem.service;

import com.thesystem.entity.ExerciseLog;
import com.thesystem.entity.HealthLog;
import com.thesystem.repository.ExerciseLogRepository;
import com.thesystem.repository.HealthLogRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

/**
 * Module 2 — Health OS: daily health logs (sleep/food/water/energy) and exercise logs.
 */
@Service
public class HealthService {

    private final HealthLogRepository healthRepo;
    private final ExerciseLogRepository exerciseRepo;

    public HealthService(HealthLogRepository healthRepo, ExerciseLogRepository exerciseRepo) {
        this.healthRepo = healthRepo;
        this.exerciseRepo = exerciseRepo;
    }

    public HealthLog upsertHealth(Long playerId, HealthLog body) {
        LocalDate date = body.getLogDate() != null ? body.getLogDate() : LocalDate.now();
        HealthLog log = healthRepo.findByPlayerIdAndLogDate(playerId, date).orElseGet(HealthLog::new);
        log.setPlayerId(playerId);
        log.setLogDate(date);
        log.setSleepBedtime(body.getSleepBedtime());
        log.setSleepWakeTime(body.getSleepWakeTime());
        log.setSleepQuality(body.getSleepQuality());
        log.setWaterGlasses(body.getWaterGlasses());
        log.setBreakfastEaten(body.isBreakfastEaten());
        log.setBreakfastWhat(body.getBreakfastWhat());
        log.setLunchEaten(body.isLunchEaten());
        log.setLunchWhat(body.getLunchWhat());
        log.setDinnerEaten(body.isDinnerEaten());
        log.setDinnerWhat(body.getDinnerWhat());
        log.setFoodQuality(body.getFoodQuality());
        log.setEnergyMorning(body.getEnergyMorning());
        log.setEnergyAfternoon(body.getEnergyAfternoon());
        log.setEnergyEvening(body.getEnergyEvening());
        return healthRepo.save(log);
    }

    public HealthLog today(Long playerId) {
        return healthRepo.findByPlayerIdAndLogDate(playerId, LocalDate.now()).orElse(null);
    }

    public List<HealthLog> healthHistory(Long playerId) {
        return healthRepo.findByPlayerIdOrderByLogDateDesc(playerId);
    }

    public HealthLog logWater(Long playerId, int glasses) {
        HealthLog log = healthRepo.findByPlayerIdAndLogDate(playerId, LocalDate.now())
                .orElseGet(() -> {
                    HealthLog h = new HealthLog();
                    h.setPlayerId(playerId);
                    h.setLogDate(LocalDate.now());
                    return h;
                });
        log.setWaterGlasses(glasses);
        return healthRepo.save(log);
    }

    public ExerciseLog logExercise(Long playerId, ExerciseLog body) {
        body.setId(null);
        body.setPlayerId(playerId);
        if (body.getExerciseDate() == null) body.setExerciseDate(LocalDate.now());
        return exerciseRepo.save(body);
    }

    public List<ExerciseLog> exerciseHistory(Long playerId) {
        return exerciseRepo.findByPlayerIdOrderByExerciseDateDesc(playerId);
    }
}

