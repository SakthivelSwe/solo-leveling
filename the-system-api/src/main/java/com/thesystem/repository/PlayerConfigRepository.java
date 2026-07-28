package com.thesystem.repository;

import com.thesystem.entity.PlayerConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PlayerConfigRepository extends JpaRepository<PlayerConfig, Long> {
    Optional<PlayerConfig> findByPlayerId(Long playerId);
}
