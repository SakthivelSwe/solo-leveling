package com.thesystem.repository;

import com.thesystem.entity.Flashcard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {
    List<Flashcard> findByPlayerId(Long playerId);
    List<Flashcard> findByPlayerIdAndNextReviewDateBefore(Long playerId, LocalDateTime date);
}
