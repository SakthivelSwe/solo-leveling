package com.thesystem.repository;

import com.thesystem.entity.DailyMission;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.Optional;

public interface DailyMissionRepository extends JpaRepository<DailyMission, Long> {
    Optional<DailyMission> findByPlayerIdAndMissionDate(Long playerId, LocalDate date);
}
