package com.thesystem.repository;

import com.thesystem.entity.BodyMetric;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BodyMetricRepository extends JpaRepository<BodyMetric, Long> {
    List<BodyMetric> findByPlayerIdOrderByLogDateDesc(Long playerId);
    Optional<BodyMetric> findByPlayerIdAndLogDate(Long playerId, LocalDate logDate);
}

