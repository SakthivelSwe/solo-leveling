package com.thesystem.repository;

import com.thesystem.entity.SelfDoubtEvidence;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SelfDoubtEvidenceRepository extends JpaRepository<SelfDoubtEvidence, Long> {
    List<SelfDoubtEvidence> findByPlayerIdOrderByEntryDateDesc(Long playerId);
}

