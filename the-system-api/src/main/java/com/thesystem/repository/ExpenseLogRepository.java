package com.thesystem.repository;

import com.thesystem.entity.ExpenseLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Repository
public interface ExpenseLogRepository extends JpaRepository<ExpenseLog, Long> {

    List<ExpenseLog> findByPlayerIdAndExpenseDateBetweenOrderByExpenseDateDesc(
            Long playerId, LocalDate startDate, LocalDate endDate);

    List<ExpenseLog> findByPlayerIdOrderByExpenseDateDesc(Long playerId);

    List<ExpenseLog> findTop20ByPlayerIdOrderByExpenseDateDesc(Long playerId);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM ExpenseLog e " +
           "WHERE e.playerId = :playerId AND e.expenseDate BETWEEN :start AND :end")
    double sumAmountByPlayerIdAndDateRange(
            @Param("playerId") Long playerId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    @Query("SELECT e.category AS category, COALESCE(SUM(e.amount), 0) AS total " +
           "FROM ExpenseLog e " +
           "WHERE e.playerId = :playerId AND e.expenseDate BETWEEN :start AND :end " +
           "GROUP BY e.category ORDER BY total DESC")
    List<Object[]> sumByCategoryAndDateRange(
            @Param("playerId") Long playerId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM ExpenseLog e " +
           "WHERE e.playerId = :playerId AND e.expenseDate BETWEEN :start AND :end AND e.isEssential = true")
    double sumEssentialByDateRange(
            @Param("playerId") Long playerId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM ExpenseLog e " +
           "WHERE e.playerId = :playerId AND e.expenseDate BETWEEN :start AND :end AND e.isEssential = false")
    double sumNonEssentialByDateRange(
            @Param("playerId") Long playerId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);
}
