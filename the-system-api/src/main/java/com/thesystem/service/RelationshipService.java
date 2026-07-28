package com.thesystem.service;

import com.thesystem.entity.RelationshipLog;
import com.thesystem.entity.SocialConnection;
import com.thesystem.repository.RelationshipLogRepository;
import com.thesystem.repository.SocialConnectionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

/**
 * Module 9 — Relationship OS: daily connection log (girlfriend, family, friends).
 */
@Service
public class RelationshipService {

    private final RelationshipLogRepository repo;
    private final SocialConnectionRepository socialRepo;

    public RelationshipService(RelationshipLogRepository repo, SocialConnectionRepository socialRepo) {
        this.repo = repo;
        this.socialRepo = socialRepo;
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

    // ---- Social Connections (CRM) ----
    public List<SocialConnection> getConnections(Long playerId) {
        return socialRepo.findAllByPlayerId(playerId);
    }

    public SocialConnection addConnection(Long playerId, SocialConnection body) {
        body.setId(null);
        body.setPlayerId(playerId);
        if (body.getHealthScore() == null) body.setHealthScore(100);
        return socialRepo.save(body);
    }

    public SocialConnection updateContact(Long playerId, Long connectionId, LocalDate date) {
        SocialConnection conn = socialRepo.findById(connectionId).orElseThrow();
        conn.setLastContactDate(date);
        conn.setHealthScore(Math.min(100, conn.getHealthScore() + 10)); // bump health on contact
        return socialRepo.save(conn);
    }
}

