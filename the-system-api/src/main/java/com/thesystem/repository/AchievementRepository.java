package com.thesystem.repository;

import com.thesystem.entity.Achievement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AchievementRepository extends JpaRepository<Achievement, Long> {
    List<Achievement> findByPlayerIdOrderByUnlockedAtDesc(Long playerId);
    boolean existsByPlayerIdAndAchievementKey(Long playerId, String achievementKey);
}

