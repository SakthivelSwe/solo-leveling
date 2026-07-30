package com.thesystem.repository;

import com.thesystem.entity.EmiEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmiEntryRepository extends JpaRepository<EmiEntry, Long> {

    List<EmiEntry> findByPlayerIdOrderByNextDueDateAsc(Long playerId);

    List<EmiEntry> findByPlayerIdAndStatus(Long playerId, String status);

    @Query("SELECT COALESCE(SUM(e.emiAmount), 0) FROM EmiEntry e " +
           "WHERE e.playerId = :playerId AND e.status = 'ACTIVE'")
    double sumActiveEmiAmount(@Param("playerId") Long playerId);
}
