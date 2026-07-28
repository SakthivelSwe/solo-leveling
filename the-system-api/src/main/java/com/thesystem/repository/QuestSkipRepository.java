package com.thesystem.repository;

import com.thesystem.entity.QuestSkip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface QuestSkipRepository extends JpaRepository<QuestSkip, Long> {
    List<QuestSkip> findByPlayerIdAndSkippedAt(Long playerId, LocalDate date);
    boolean existsByPlayerIdAndQuestIdAndSkippedAt(Long playerId, Long questId, LocalDate skippedAt);
    long countByPlayerIdAndQuestIdAndSkippedAtBetween(Long playerId, Long questId, LocalDate start, LocalDate end);
}
