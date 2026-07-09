package com.thesystem.repository;

import com.thesystem.entity.LeetcodeLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LeetcodeLogRepository extends JpaRepository<LeetcodeLog, Long> {
    List<LeetcodeLog> findByPlayerIdOrderBySolvedDateDesc(Long playerId);
    /** Bounded recent history — avoids returning an unbounded payload as the log grows. */
    List<LeetcodeLog> findTop60ByPlayerIdOrderBySolvedDateDesc(Long playerId);
    long countByPlayerId(Long playerId);
    long countByPlayerIdAndDifficulty(Long playerId, String difficulty);
}

