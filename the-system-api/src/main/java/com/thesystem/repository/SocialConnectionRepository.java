package com.thesystem.repository;

import com.thesystem.entity.SocialConnection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SocialConnectionRepository extends JpaRepository<SocialConnection, Long> {
    List<SocialConnection> findAllByPlayerId(Long playerId);
}
