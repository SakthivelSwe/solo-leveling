package com.thesystem.repository;

import com.thesystem.entity.VocabularyLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VocabularyLogRepository extends JpaRepository<VocabularyLog, Long> {
    List<VocabularyLog> findByPlayerIdOrderByLearnedDateDesc(Long playerId);
}

