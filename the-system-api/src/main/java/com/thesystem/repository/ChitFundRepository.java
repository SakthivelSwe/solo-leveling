package com.thesystem.repository;

import com.thesystem.entity.ChitFund;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChitFundRepository extends JpaRepository<ChitFund, Long> {

    List<ChitFund> findByPlayerIdOrderByStartDateDesc(Long playerId);

    List<ChitFund> findByPlayerIdAndStatusOrderByStartDateDesc(Long playerId, String status);

    @Query("SELECT COUNT(c) FROM ChitFund c WHERE c.playerId = :playerId")
    long countByPlayerId(@Param("playerId") Long playerId);

    @Query("SELECT SUM(c.monthlyContribution) FROM ChitFund c WHERE c.playerId = :playerId AND c.status = 'ACTIVE'")
    Double sumActiveMonthlyCommitments(@Param("playerId") Long playerId);
}
