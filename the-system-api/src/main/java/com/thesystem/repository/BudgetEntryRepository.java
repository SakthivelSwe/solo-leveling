package com.thesystem.repository;

import com.thesystem.entity.BudgetEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BudgetEntryRepository extends JpaRepository<BudgetEntry, Long> {
    List<BudgetEntry> findByPlayerIdOrderByEntryMonthDesc(Long playerId);
    Optional<BudgetEntry> findByPlayerIdAndEntryMonth(Long playerId, String entryMonth);
}

