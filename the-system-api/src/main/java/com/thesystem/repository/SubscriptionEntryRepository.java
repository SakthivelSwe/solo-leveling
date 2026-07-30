package com.thesystem.repository;

import com.thesystem.entity.SubscriptionEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubscriptionEntryRepository extends JpaRepository<SubscriptionEntry, Long> {

    List<SubscriptionEntry> findByPlayerIdOrderByNextBillingDateAsc(Long playerId);

    List<SubscriptionEntry> findByPlayerIdAndIsActive(Long playerId, boolean isActive);

    @Query("SELECT COALESCE(SUM(s.amount), 0) FROM SubscriptionEntry s " +
           "WHERE s.playerId = :playerId AND s.isActive = true AND s.frequency = 'MONTHLY'")
    double sumActiveMonthlySubscriptions(@Param("playerId") Long playerId);
}
