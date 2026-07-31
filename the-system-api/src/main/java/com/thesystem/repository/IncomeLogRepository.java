package com.thesystem.repository;

import com.thesystem.entity.IncomeLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface IncomeLogRepository extends JpaRepository<IncomeLog, Long> {
    List<IncomeLog> findTop20ByPlayerIdOrderByIncomeDateDesc(Long playerId);
    
    List<IncomeLog> findByPlayerIdAndIncomeDateBetweenOrderByIncomeDateDesc(Long playerId, LocalDate start, LocalDate end);
    
    @Query("SELECT SUM(i.amount) FROM IncomeLog i WHERE i.playerId = :playerId AND i.incomeDate BETWEEN :start AND :end")
    Double sumAmountByPlayerIdAndDateRange(Long playerId, LocalDate start, LocalDate end);
}
