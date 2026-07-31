package com.thesystem.service;

import com.thesystem.entity.JobChangeQuest;
import com.thesystem.entity.Player;
import com.thesystem.repository.JobChangeQuestRepository;
import com.thesystem.repository.PlayerRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class JobChangeService {
    private final JobChangeQuestRepository jobChangeRepo;
    private final PlayerRepository playerRepo;

    public JobChangeService(JobChangeQuestRepository jobChangeRepo, PlayerRepository playerRepo) {
        this.jobChangeRepo = jobChangeRepo;
        this.playerRepo = playerRepo;
    }

    public JobChangeQuest getOrCreateQuest(Long playerId) {
        return jobChangeRepo.findById(playerId).orElseGet(() -> {
            JobChangeQuest q = new JobChangeQuest();
            q.setPlayerId(playerId);
            return jobChangeRepo.save(q);
        });
    }

    public JobChangeQuest checkAndTrigger(Long playerId) {
        Player p = playerRepo.findById(playerId).orElseThrow();
        JobChangeQuest q = getOrCreateQuest(playerId);
        
        if (!q.isActive() && !q.isCompleted() && p.getLevel() >= 10) {
            q.setActive(true);
            q.setStartedAt(LocalDateTime.now());
            q.setDeadline(LocalDateTime.now().plusDays(3));
            q.setRequiredQuests(20);
            q.setCompletedQuests(0);
            return jobChangeRepo.save(q);
        }
        return q;
    }

    public JobChangeQuest progressQuest(Long playerId) {
        JobChangeQuest q = getOrCreateQuest(playerId);
        if (q.isActive() && !q.isCompleted()) {
            q.setCompletedQuests(q.getCompletedQuests() + 1);
            if (q.getCompletedQuests() >= q.getRequiredQuests()) {
                q.setCompleted(true);
                q.setActive(false);
                
                // Awaken Class
                Player p = playerRepo.findById(playerId).orElseThrow();
                p.setArchetype("SHADOW_MONARCH");
                playerRepo.save(p);
            }
            return jobChangeRepo.save(q);
        }
        return q;
    }
}
