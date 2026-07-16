package com.thesystem.service;

import com.thesystem.entity.ExerciseLog;
import com.thesystem.entity.HealthLog;
import com.thesystem.dto.SleepEntryDTO;
import com.thesystem.repository.ExerciseLogRepository;
import com.thesystem.repository.HealthLogRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
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

    /* ===== Phase 2 — Dedicated Sleep Tracker ===== */

    private static final DateTimeFormatter HHMM = DateTimeFormatter.ofPattern("HH:mm");

    /** Upsert just the sleep fields (bedtime / wake time / quality) for a day. */
    public HealthLog upsertSleep(Long playerId, String date, String bedtime, String wakeTime, Integer quality) {
        LocalDate day = (date != null && !date.isBlank()) ? LocalDate.parse(date) : LocalDate.now();
        HealthLog log = healthRepo.findByPlayerIdAndLogDate(playerId, day).orElseGet(() -> {
            HealthLog h = new HealthLog();
            h.setPlayerId(playerId);
            h.setLogDate(day);
            return h;
        });
        if (bedtime != null && !bedtime.isBlank())   log.setSleepBedtime(LocalTime.parse(bedtime));
        if (wakeTime != null && !wakeTime.isBlank())  log.setSleepWakeTime(LocalTime.parse(wakeTime));
        if (quality != null)                          log.setSleepQuality(quality);
        return healthRepo.save(log);
    }

    /**
     * Sleep history (oldest → newest) with the duration computed from bedtime →
     * wake time, correctly handling nights that cross midnight.
     */
    public List<SleepEntryDTO> sleepHistory(Long playerId) {
        List<HealthLog> logs = healthRepo.findByPlayerIdOrderByLogDateDesc(playerId);
        List<SleepEntryDTO> out = new ArrayList<>();
        for (HealthLog h : logs) {
            LocalTime bed = h.getSleepBedtime();
            LocalTime wake = h.getSleepWakeTime();
            if (bed == null || wake == null) continue;
            long minutes = Duration.between(bed, wake).toMinutes();
            if (minutes <= 0) minutes += 24 * 60; // crossed midnight
            out.add(new SleepEntryDTO(
                    h.getLogDate().toString(),
                    bed.format(HHMM),
                    wake.format(HHMM),
                    minutes,
                    h.getSleepQuality()
            ));
        }
        // Return oldest → newest so the chart reads left-to-right.
        java.util.Collections.reverse(out);
        return out;
    }
}
