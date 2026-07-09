package com.thesystem.repository;

import com.thesystem.entity.QuestCompletion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface QuestCompletionRepository extends JpaRepository<QuestCompletion, Long> {
    List<QuestCompletion> findByPlayerIdAndCompletedAt(Long playerId, LocalDate date);
    boolean existsByPlayerIdAndQuestIdAndCompletedAt(Long playerId, Long questId, LocalDate date);
    List<QuestCompletion> findByPlayerIdAndCompletedAtBetween(Long playerId, LocalDate start, LocalDate end);
    long countByPlayerId(Long playerId);
    long countByPlayerIdAndQuestId(Long playerId, Long questId);
    long countByPlayerIdAndCompletedAt(Long playerId, LocalDate date);
    List<QuestCompletion> findByPlayerIdOrderByCompletedAtDesc(Long playerId);
}

