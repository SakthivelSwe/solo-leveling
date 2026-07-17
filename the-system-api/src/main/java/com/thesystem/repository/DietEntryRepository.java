package com.thesystem.repository;

import com.thesystem.entity.DietEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface DietEntryRepository extends JpaRepository<DietEntry, Long> {
    List<DietEntry> findByPlayerIdAndConsumedDate(Long playerId, LocalDate date);
    List<DietEntry> findByPlayerIdAndConsumedDateBetween(Long playerId, LocalDate startDate, LocalDate endDate);
}
