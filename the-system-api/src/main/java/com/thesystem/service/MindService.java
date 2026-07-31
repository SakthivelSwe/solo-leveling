package com.thesystem.service;

import com.thesystem.entity.MindLog;
import com.thesystem.entity.SelfDoubtEvidence;
import com.thesystem.dto.MoodPointDTO;
import com.thesystem.repository.MindLogRepository;
import com.thesystem.repository.SelfDoubtEvidenceRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Module 3 — Mind OS: daily mind logs (mood/anxiety/reflection) and the
 * "evidence against self-doubt" ledger surfaced when mood is low.
 */
@Service
public class MindService {

    private final MindLogRepository mindRepo;
    private final SelfDoubtEvidenceRepository evidenceRepo;
        private final AiMemoryService aiMemoryService;
    private final com.thesystem.repository.PlayerRepository playerRepo;

    public MindService(MindLogRepository mindRepo, SelfDoubtEvidenceRepository evidenceRepo, AiMemoryService aiMemoryService, com.thesystem.repository.PlayerRepository playerRepo) {
        this.mindRepo = mindRepo;
        this.evidenceRepo = evidenceRepo;
        this.aiMemoryService = aiMemoryService;
        this.playerRepo = playerRepo;
    }

        public List<String> getMentalDebuffs(Long playerId) {
        MindLog latestLog = mindRepo.findFirstByPlayerIdOrderByLogDateDesc(playerId).orElse(null);
        List<String> debuffs = new ArrayList<>();
        if (latestLog != null) {
            if (latestLog.getAnxietyLevel() >= 7) debuffs.add("High Anxiety (XP penalty)");
            if (latestLog.getMoodMorning() <= 3) debuffs.add("Low Morning Mood (Energy drain)");
            if (latestLog.getDarkThought() != null && !latestLog.getDarkThought().isBlank()) debuffs.add("Lingering Dark Thoughts (Focus penalty)");
        }
        return debuffs;
    }

    public void cleanseDebuffs(Long playerId) {
        MindLog latestLog = mindRepo.findFirstByPlayerIdOrderByLogDateDesc(playerId).orElse(null);
        if (latestLog != null) {
            latestLog.setAnxietyLevel(Math.max(1, latestLog.getAnxietyLevel() - 3));
            latestLog.setMoodMorning(Math.max(5, latestLog.getMoodMorning()));
            latestLog.setDarkThought("");
            mindRepo.save(latestLog);
            aiMemoryService.addImmediateMemory(playerId, "BEHAVIORAL", "Completed a mindfulness cleansing session.");
        }
    }

    public MindLog upsert(Long playerId, MindLog body) {
        LocalDate date = body.getLogDate() != null ? body.getLogDate() : LocalDate.now();
        MindLog log = mindRepo.findByPlayerIdAndLogDate(playerId, date).orElseGet(MindLog::new);
        log.setPlayerId(playerId);
        log.setLogDate(date);
        log.setMoodMorning(body.getMoodMorning());
        log.setMoodEvening(body.getMoodEvening());
        log.setAnxietyLevel(body.getAnxietyLevel());
        log.setMorningIntention(body.getMorningIntention());
        log.setEveningReflection(body.getEveningReflection());
        log.setTodayWin(body.getTodayWin());
        log.setGratitude(body.getGratitude());
        log.setDarkThought(body.getDarkThought());
        log.setCounterEvidence(body.getCounterEvidence());
        // A logged win is also permanent evidence against self-doubt
        if (body.getTodayWin() != null && !body.getTodayWin().isBlank()) {
            addEvidence(playerId, body.getTodayWin(), "CHARACTER");
            aiMemoryService.addImmediateMemory(playerId, "BEHAVIORAL", "Win of the day: " + body.getTodayWin());
        }
        if (body.getDarkThought() != null && !body.getDarkThought().isBlank()) {
            aiMemoryService.addImmediateMemory(playerId, "BEHAVIORAL", "Logged a dark thought/anxiety: " + body.getDarkThought());
        }
        return mindRepo.save(log);
    }

    public MindLog today(Long playerId) {
        return mindRepo.findByPlayerIdAndLogDate(playerId, LocalDate.now()).orElse(null);
    }

    public List<MindLog> history(Long playerId) {
        return mindRepo.findByPlayerIdOrderByLogDateDesc(playerId);
    }

    public SelfDoubtEvidence addEvidence(Long playerId, String evidence, String category) {
        return evidenceRepo.save(new SelfDoubtEvidence(playerId, evidence, category));
    }

    public List<SelfDoubtEvidence> evidence(Long playerId) {
        return evidenceRepo.findByPlayerIdOrderByEntryDateDesc(playerId);
    }

    /* ===== Phase 2 — Mood Trend Graph ===== */

    /**
     * Returns up to {days} recent mood points (oldest → newest) for the line
     * chart. Each point's `mood` is the average of the available morning/evening
     * scores; days with no mood recorded are skipped.
     */
    public List<MoodPointDTO> moodTrend(Long playerId, int days) {
        LocalDate cutoff = LocalDate.now().minusDays(Math.max(1, days) - 1L);
        List<MindLog> logs = mindRepo.findByPlayerIdOrderByLogDateDesc(playerId);
        List<MoodPointDTO> out = new ArrayList<>();
        for (MindLog m : logs) {
            if (m.getLogDate() == null || m.getLogDate().isBefore(cutoff)) continue;
            Integer morning = m.getMoodMorning();
            Integer evening = m.getMoodEvening();
            if (morning == null && evening == null) continue;
            double avg;
            if (morning != null && evening != null) avg = (morning + evening) / 2.0;
            else avg = (morning != null) ? morning : evening;
            out.add(new MoodPointDTO(m.getLogDate().toString(), avg, morning, evening));
        }
        java.util.Collections.reverse(out); // oldest → newest for the chart
        return out;
    }
    public java.util.Map<String, Object> startMeditation(Long playerId) {
        return java.util.Map.of("message", "Meditation session started.", "timestamp", java.time.LocalDateTime.now());
    }

    public java.util.Map<String, Object> completeMeditation(Long playerId, int minutes) {
        com.thesystem.entity.Player p = playerRepo.findById(playerId).orElseThrow();
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.LocalDateTime currentBuff = p.getClarityBuffEnd();
        
        if (currentBuff == null || currentBuff.isBefore(now)) {
            p.setClarityBuffEnd(now.plusHours(2));
        } else {
            p.setClarityBuffEnd(currentBuff.plusHours(2));
        }
        playerRepo.save(p);
        
        return java.util.Map.of(
            "message", "Meditation complete. CLARITY BUFF active for 2 hours (+50% XP).",
            "clarityBuffEnd", p.getClarityBuffEnd()
        );
    }
}


