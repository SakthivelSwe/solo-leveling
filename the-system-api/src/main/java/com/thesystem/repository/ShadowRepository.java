package com.thesystem.repository;

import com.thesystem.entity.Shadow;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ShadowRepository extends JpaRepository<Shadow, Long> {
    List<Shadow> findByPlayerIdOrderByShadowLevelDesc(Long playerId);
    Optional<Shadow> findByPlayerIdAndHabitId(Long playerId, Long habitId);
    boolean existsByPlayerIdAndHabitId(Long playerId, Long habitId);
}
