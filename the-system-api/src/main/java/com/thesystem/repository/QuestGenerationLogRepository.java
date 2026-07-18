package com.thesystem.repository;

import com.thesystem.entity.QuestGenerationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public interface QuestGenerationLogRepository extends JpaRepository<QuestGenerationLog, Long> {
    boolean existsByPlayerIdAndGenerationDate(Long playerId, LocalDate generationDate);
}
