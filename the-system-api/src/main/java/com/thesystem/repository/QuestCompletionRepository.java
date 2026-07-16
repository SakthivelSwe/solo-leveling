package com.thesystem.repository;

import com.thesystem.entity.QuestCompletion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    /**
     * Counts completions for quests flagged as recovery quests on a given date.
     * Used by EndOfDayScheduler to double-count recovery quests toward the HP threshold.
     */
    @Query("SELECT COUNT(qc) FROM QuestCompletion qc " +
           "JOIN Quest q ON q.id = qc.questId " +
           "WHERE qc.playerId = :playerId AND qc.completedAt = :date AND q.recoveryQuest = true")
    long countRecoveryQuestsByPlayerIdAndCompletedAt(
            @Param("playerId") Long playerId, @Param("date") LocalDate date);

    @Query("SELECT CASE WHEN COUNT(qc) > 0 THEN true ELSE false END FROM QuestCompletion qc " +
           "JOIN Quest q ON q.id = qc.questId " +
           "WHERE qc.playerId = :playerId AND qc.completedAt = :date AND q.questKey = :questKey")
    boolean existsByPlayerIdAndQuestKeyAndCompletedAt(
            @Param("playerId") Long playerId, @Param("questKey") String questKey, @Param("date") LocalDate date);
}

