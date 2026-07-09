package com.thesystem.service;

import com.thesystem.entity.RelationshipLog;
import com.thesystem.repository.RelationshipLogRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

/**
 * Module 9 — Relationship OS: daily connection log (girlfriend, family, friends).
 */
@Service
public class RelationshipService {

    private final RelationshipLogRepository repo;

    public RelationshipService(RelationshipLogRepository repo) {
        this.repo = repo;
    }

    public RelationshipLog upsert(Long playerId, RelationshipLog body) {
        LocalDate date = body.getLogDate() != null ? body.getLogDate() : LocalDate.now();
        RelationshipLog log = repo.findByPlayerIdAndLogDate(playerId, date).orElseGet(RelationshipLog::new);
        log.setPlayerId(playerId);
        log.setLogDate(date);
        log.setGfCalled(body.isGfCalled());
        log.setCallDurationMin(body.getCallDurationMin());
        log.setCallQuality(body.getCallQuality());
        log.setFamilyContact(body.isFamilyContact());
        log.setFriendMessage(body.isFriendMessage());
        log.setFriendName(body.getFriendName());
        log.setNotes(body.getNotes());
        return repo.save(log);
    }

    public RelationshipLog today(Long playerId) {
        return repo.findByPlayerIdAndLogDate(playerId, LocalDate.now()).orElse(null);
    }

    public List<RelationshipLog> history(Long playerId) {
        return repo.findByPlayerIdOrderByLogDateDesc(playerId);
    }
}

