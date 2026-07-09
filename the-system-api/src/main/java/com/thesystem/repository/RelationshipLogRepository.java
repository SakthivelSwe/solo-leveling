package com.thesystem.repository;

import com.thesystem.entity.RelationshipLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface RelationshipLogRepository extends JpaRepository<RelationshipLog, Long> {
    List<RelationshipLog> findByPlayerIdOrderByLogDateDesc(Long playerId);
    Optional<RelationshipLog> findByPlayerIdAndLogDate(Long playerId, LocalDate logDate);
}

