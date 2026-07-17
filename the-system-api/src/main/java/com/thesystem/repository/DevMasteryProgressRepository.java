package com.thesystem.repository;

import com.thesystem.entity.DevMasteryProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DevMasteryProgressRepository extends JpaRepository<DevMasteryProgress, Long> {
    List<DevMasteryProgress> findByPlayerId(Long playerId);
    Optional<DevMasteryProgress> findByPlayerIdAndTopicId(Long playerId, String topicId);
}
