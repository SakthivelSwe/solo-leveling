package com.thesystem.repository;

import com.thesystem.entity.PlayerSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PlayerSkillRepository extends JpaRepository<PlayerSkill, Long> {
    List<PlayerSkill> findByPlayerId(Long playerId);
    Optional<PlayerSkill> findByPlayerIdAndSkillName(Long playerId, String skillName);
}

