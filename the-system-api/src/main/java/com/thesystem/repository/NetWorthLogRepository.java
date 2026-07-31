package com.thesystem.repository;

import com.thesystem.entity.NetWorthLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface NetWorthLogRepository extends JpaRepository<NetWorthLog, Long> {
    List<NetWorthLog> findAllByPlayerIdOrderByLogDateDesc(Long playerId);
    Optional<NetWorthLog> findByPlayerIdAndLogDate(Long playerId, LocalDate date);
    Optional<NetWorthLog> findFirstByPlayerIdOrderByLogDateDesc(Long playerId);
}
