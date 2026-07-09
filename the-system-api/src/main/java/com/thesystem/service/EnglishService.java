package com.thesystem.service;

import com.thesystem.entity.EnglishLog;
import com.thesystem.entity.VocabularyLog;
import com.thesystem.repository.EnglishLogRepository;
import com.thesystem.repository.VocabularyLogRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

/**
 * Module 5 — English OS: speaking-practice logs and a growing vocabulary book.
 */
@Service
public class EnglishService {

    private final EnglishLogRepository englishRepo;
    private final VocabularyLogRepository vocabRepo;

    public EnglishService(EnglishLogRepository englishRepo, VocabularyLogRepository vocabRepo) {
        this.englishRepo = englishRepo;
        this.vocabRepo = vocabRepo;
    }

    public EnglishLog upsert(Long playerId, EnglishLog body) {
        LocalDate date = body.getLogDate() != null ? body.getLogDate() : LocalDate.now();
        EnglishLog log = englishRepo.findByPlayerIdAndLogDate(playerId, date).orElseGet(EnglishLog::new);
        log.setPlayerId(playerId);
        log.setLogDate(date);
        log.setSpeakingMin(body.getSpeakingMin());
        log.setResourceUsed(body.getResourceUsed());
        log.setNewWords(body.getNewWords());
        log.setMockInterview(body.isMockInterview());
        log.setTopicPracticed(body.getTopicPracticed());
        log.setSelfRating(body.getSelfRating());
        log.setNotes(body.getNotes());
        return englishRepo.save(log);
    }

    public List<EnglishLog> history(Long playerId) {
        return englishRepo.findByPlayerIdOrderByLogDateDesc(playerId);
    }

    public VocabularyLog addWord(Long playerId, VocabularyLog body) {
        body.setId(null);
        body.setPlayerId(playerId);
        if (body.getLearnedDate() == null) body.setLearnedDate(LocalDate.now());
        return vocabRepo.save(body);
    }

    public List<VocabularyLog> vocabulary(Long playerId) {
        return vocabRepo.findByPlayerIdOrderByLearnedDateDesc(playerId);
    }
}

