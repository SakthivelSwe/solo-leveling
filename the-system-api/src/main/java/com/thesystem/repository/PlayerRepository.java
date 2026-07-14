package com.thesystem.repository;

import com.thesystem.entity.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PlayerRepository extends JpaRepository<Player, Long> {
    Optional<Player> findByUsername(String username);
    /** Case-insensitive lookup — used for login so "Sakthivel" == "SAKTHIVEL" == "sakthivel" */
    Optional<Player> findByUsernameIgnoreCase(String username);
    Optional<Player> findByEmail(String email);
    boolean existsByUsername(String username);
    /** Case-insensitive duplicate check on registration */
    boolean existsByUsernameIgnoreCase(String username);
    boolean existsByEmail(String email);
    List<Player> findTop10ByOrderByTotalXpDesc();
}

