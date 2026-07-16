package com.thesystem.repository;

import com.thesystem.entity.LearningLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface LearningLogRepository extends JpaRepository<LearningLog, Long> {

    /** Recent sessions for the history view (last 30 entries). */
    List<LearningLog> findTop30ByPlayerIdOrderByLogDateDescCreatedAtDesc(Long playerId);

    /** All sessions for a player on a specific date. */
    List<LearningLog> findByPlayerIdAndLogDate(Long playerId, LocalDate logDate);

    /** Due recalls: review overdue AND recall not yet done. */
    List<LearningLog> findByPlayerIdAndRecallDoneFalseAndReviewDueDateLessThanEqual(
            Long playerId, LocalDate today);

    /** Total XP earned from learning for a player. */
    @Query("SELECT COALESCE(SUM(l.xpEarned), 0) FROM LearningLog l WHERE l.playerId = :playerId")
    int sumXpByPlayerId(@Param("playerId") Long playerId);

    /** Total minutes studied for a player in a date range. */
    @Query("SELECT COALESCE(SUM(l.durationMinutes), 0) FROM LearningLog l " +
           "WHERE l.playerId = :playerId AND l.logDate >= :from AND l.logDate <= :to")
    int sumMinutesByPlayerIdAndDateRange(@Param("playerId") Long playerId,
                                        @Param("from") LocalDate from,
                                        @Param("to") LocalDate to);

    /** Count sessions per subject for pie chart. */
    @Query("SELECT l.subject, COUNT(l), SUM(l.durationMinutes) FROM LearningLog l " +
           "WHERE l.playerId = :playerId AND l.logDate >= :from " +
           "GROUP BY l.subject ORDER BY SUM(l.durationMinutes) DESC")
    List<Object[]> subjectStats(@Param("playerId") Long playerId, @Param("from") LocalDate from);

    /** Daily minutes for heat chart (last N days). */
    @Query("SELECT l.logDate, SUM(l.durationMinutes) FROM LearningLog l " +
           "WHERE l.playerId = :playerId AND l.logDate >= :from " +
           "GROUP BY l.logDate ORDER BY l.logDate ASC")
    List<Object[]> dailyMinutes(@Param("playerId") Long playerId, @Param("from") LocalDate from);

    /** Count recalls done vs total for recall rate. */
    @Query("SELECT COUNT(l) FROM LearningLog l WHERE l.playerId = :playerId AND l.recallDone = true")
    long countRecallsDone(@Param("playerId") Long playerId);

    @Query("SELECT COUNT(l) FROM LearningLog l WHERE l.playerId = :playerId")
    long countTotal(@Param("playerId") Long playerId);

    /** Check if a DevMastery topic was already synced. */
    boolean existsByPlayerIdAndDevMasteryTopicId(Long playerId, String devMasteryTopicId);

    /** Sessions by source for DevMastery sync tracking. */
    @Query("SELECT COUNT(l) FROM LearningLog l WHERE l.playerId = :playerId AND l.source = 'DEVMASTERY'")
    long countDevMasterySessions(@Param("playerId") Long playerId);
}
