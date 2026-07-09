package com.thesystem.repository;

import com.thesystem.entity.Habit;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HabitRepository extends JpaRepository<Habit, Long> {
    List<Habit> findByPlayerIdAndArchivedFalseOrderByKeystoneDescCreatedAtAsc(Long playerId);
    List<Habit> findByPlayerIdOrderByCreatedAtAsc(Long playerId);
    long countByPlayerIdAndArchivedFalse(Long playerId);
}

