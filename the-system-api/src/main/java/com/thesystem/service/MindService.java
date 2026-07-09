package com.thesystem.service;

import com.thesystem.entity.MindLog;
import com.thesystem.entity.SelfDoubtEvidence;
import com.thesystem.repository.MindLogRepository;
import com.thesystem.repository.SelfDoubtEvidenceRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

/**
 * Module 3 — Mind OS: daily mind logs (mood/anxiety/reflection) and the
 * "evidence against self-doubt" ledger surfaced when mood is low.
 */
@Service
public class MindService {

    private final MindLogRepository mindRepo;
    private final SelfDoubtEvidenceRepository evidenceRepo;

    public MindService(MindLogRepository mindRepo, SelfDoubtEvidenceRepository evidenceRepo) {
        this.mindRepo = mindRepo;
        this.evidenceRepo = evidenceRepo;
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
}

