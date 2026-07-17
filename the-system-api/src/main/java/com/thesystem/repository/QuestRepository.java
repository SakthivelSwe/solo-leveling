package com.thesystem.repository;

import com.thesystem.entity.Quest;
import com.thesystem.entity.QuestCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface QuestRepository extends JpaRepository<Quest, Long> {

    Optional<Quest> findByQuestKey(String questKey);

    List<Quest> findByActiveTrueOrderByCategoryAscXpRewardDesc();

    boolean existsByQuestKey(String questKey);

    /** All active DAILY-type quests visible to this player (system + player's own custom). */
    @Query("SELECT q FROM Quest q WHERE q.active = true AND q.timeType = 'DAILY' " +
           "AND (q.ownerId IS NULL OR q.ownerId = :playerId) " +
           "AND q.category NOT IN ('SIDE','MILESTONE') " +
           "ORDER BY q.priority DESC, q.xpReward DESC")
    List<Quest> findDailyQuestsForPlayer(@Param("playerId") Long playerId);

    /** All active WEEKLY quests visible to this player. */
    @Query("SELECT q FROM Quest q WHERE q.active = true AND q.timeType = 'WEEKLY' " +
           "AND (q.ownerId IS NULL OR q.ownerId = :playerId) " +
           "ORDER BY q.priority DESC, q.xpReward DESC")
    List<Quest> findWeeklyQuestsForPlayer(@Param("playerId") Long playerId);

    /** All active MONTHLY quests visible to this player. */
    @Query("SELECT q FROM Quest q WHERE q.active = true AND q.timeType = 'MONTHLY' " +
           "AND (q.ownerId IS NULL OR q.ownerId = :playerId) " +
           "ORDER BY q.priority DESC, q.xpReward DESC")
    List<Quest> findMonthlyQuestsForPlayer(@Param("playerId") Long playerId);

    /** All active ONE_TIME / MILESTONE / SIDE quests (global milestones, no player filter). */
    @Query("SELECT q FROM Quest q WHERE q.active = true " +
           "AND (q.timeType = 'ONE_TIME' OR q.category IN ('SIDE','MILESTONE')) " +
           "ORDER BY q.priority DESC, q.xpReward DESC")
    List<Quest> findMilestoneQuests();

    /** Custom quests owned by this player (for delete/manage). */
    List<Quest> findByOwnerIdAndActiveTrueOrderByIdDesc(Long ownerId);

    /** Find a custom quest owned by a specific player. */
    Optional<Quest> findByQuestKeyAndOwnerId(String questKey, Long ownerId);
}

